(function() {
    // load local storage
    var storedValues = [...document.querySelectorAll('.store')];
    for (s in storedValues) storedValues[s].value = localStorage.getItem(storedValues[s].id);

    // restore Obsidian save switch state
    if (localStorage.getItem('obsidian') == 'true') {
        document.getElementById('obsidian-switch').checked = true;
        document.getElementById('obsidian-vault').parentNode.classList.remove('fade');
    }

    //initialize log
    if (!localStorage.getItem("log")) localStorage.setItem("log", '[]');

    updateFields();
    displayStacking();

    // set focus on relevant field
    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value;

    if ((icr == false && isf == false && target == false) || icr == false) document.getElementById('icr').focus();
    else if ((isf == false && target == false) || isf == false) document.getElementById('isf').focus();
    else if (target == false) document.getElementById('target').focus();
})();

//add carb fields
function addField() {
    var fieldNumber = [...document.querySelectorAll('.carb')].length + 1;
    document.getElementById('carbs').parentNode.insertAdjacentHTML('beforeend',
        '<input type="number" class="carb form-control form-control-lg mb-2" pattern="[0-9]*" placeholder="carbs" class="carb" id="carbs' +
        fieldNumber +
        '">');
    document.getElementById("carbs" + fieldNumber).focus();
};
document.getElementById('add-btn').addEventListener('click', addField);

document.addEventListener('keydown', function (event) {
    //backspace - delete carb
    if (event.keyCode == 8 || event.keyCode == 46) {
        var fieldId = document.activeElement.id,
            field = document.getElementById(fieldId),
            fields = [...document.querySelectorAll('.carb')];

        if (field.value == "" && /carb/.test(fieldId) && fieldId != 'carbs') {
            event.preventDefault();
            field.previousElementSibling.focus();
            field.parentNode.removeChild(field);
        }
    }
    //enter - create carb
    if(event.keyCode == 13) {
        var fieldId = document.activeElement.id;
        if (/carb/.test(fieldId)) {
            event.preventDefault();
            addField();
        }
    }
});

function clearFields() {
    var carbs = [...document.querySelectorAll('.carb')];
    for (i in carbs) {
        if (i == 0) carbs[i].value = '';
        else carbs[i].parentNode.removeChild(carbs[i]);
    }
    document.getElementById('bg').value = '';

    updateFields();
}
document.getElementById('clear-btn').addEventListener('click', clearFields);

function updateFields() {
    storeValues();

    if ( checkRequired() )
        calcUnits();
}
document.addEventListener('keyup', updateFields);

function storeValues() {
    var storedValues = [...document.querySelectorAll('.store')];
    for (s in storedValues) {
        var value = storedValues[s].value;
        if (storedValues[s].id == 'carbs') value = addCarbs();
        localStorage.setItem(storedValues[s].id, value);
    }
}

function checkRequired() {
    var required = [...document.querySelectorAll('.required')],
        hasTerms = true;
    for (r in required) {
        if ( !required[r].value || parseInt(required[r].value) < parseInt(required[r].min) ) {
            required[r].classList.add('is-invalid');
            if (required[r].classList.contains('term')) hasTerms = false;
        }
        else required[r].classList.remove('is-invalid');
    }

    var elems = [...document.querySelectorAll('.dose .form-control, .dose .btn')];
    if ( hasTerms ) {
        for (e in elems) elems[e].removeAttribute('disabled');
        return true;
    }
    else {
        for (e in elems) elems[e].setAttribute('disabled', '');
        document.getElementById('units').value = '';
        document.getElementById('bg').placeholder = '';
        return false;
    }
}

function calcUnits() {
    var carbs = addCarbs(),
        bg = parseInt(document.getElementById('bg').value),
        icr = parseFloat(document.getElementById('icr').value),
        isf = parseInt(document.getElementById('isf').value),
        target = parseInt(document.getElementById('target').value);

    // set current BGL placeholder
    document.getElementById('bg').placeholder = "if > " + target;

    //use ratios to calulate units
    if (carbs && bg > target) var units = ((bg - target) / isf) + (carbs / icr);
    else if (carbs) var units = carbs / icr;
    else if (bg > target) var units = (bg - target) / isf;
    else var units = 0;
    
    document.getElementById('units').value = Math.round(units*10)/10;
}

function addCarbs() {
    var totalCarbs = 0,
        carbs = [...document.querySelectorAll('.carb')];
    for (c in carbs) {
        var carb = carbs[c].value;
        if (!carb) carb = 0;
        totalCarbs += parseInt(carb);
    }

    totalCarbs = totalCarbs == 0 ? '' : totalCarbs;

    return totalCarbs;
}

function logDose() {
    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value,
        carbs = addCarbs() || 0,
        bg = document.getElementById('bg').value || target,
        units = Math.round(document.getElementById('units').value),
        datetime = new Date().getTime();

    // write log entry object
    var entry = {
        datetime: datetime,
        units: units,
        carbs: carbs,
        bg: bg,
        icr: icr,
        isf: isf,
        target: target
    };

    var log = JSON.parse(localStorage.getItem("log"));

    // add log item
    log.push(entry);
    localStorage.setItem("log", JSON.stringify(log));
    if(document.getElementById('log').innerHTML) loadLog(log);

    clearFields();
    displayStacking();
}
document.getElementById('log-btn').addEventListener('click', logDose);

function loadLog() {
    var o = JSON.parse(localStorage.getItem('log')),
        log = document.getElementById("log");
    if (log.innerHTML) log.innerHTML = "";
    log.classList.remove('d-none');
    
    document.getElementById('view-log-btn').classList.add('d-none');
    document.getElementById('delete-all-btn').classList.remove('d-none');
    
    if (o.length < 1) {
        log.innerHTML = '<span class="invalid-feedback d-block">No log items...</span>'
        return;
    }

    // create log headers
    let thead = document.createElement("THEAD"),
        tr = document.createElement("TR");

    tr.setAttribute("id", "logHeader");
    thead.appendChild(tr);

    var headCols = ['Date', 'Units', 'Carbs', 'BGL', 'ICR', 'ISF', 'Target', ''];

    for (c in headCols) {
        let th = document.createElement("TH"),
            h = document.createTextNode(headCols[c]);

        th.setAttribute("scope", "col");
        th.appendChild(h);
        tr.appendChild(th);
    }

    log.appendChild(thead);

    // populate log
    o.reverse();
    var tbody = document.createElement("TBODY");

    for (i in o) {
        let tr = document.createElement("TR");
        tr.setAttribute("class", "logItem");
        tr.setAttribute("id", o[i].datetime);

        var bodyCols = [
            formatDate(o[i].datetime),
            o[i].units,
            o[i].carbs,
            o[i].bg,
            o[i].icr,
            o[i].isf,
            o[i].target,
            '<button class="delete-btn btn btn-sm p-1 btn-danger bg-danger" type="button"><i class="bi bi-x-lg"></i></button>'
        ];

        for (c in bodyCols) {
            let td = document.createElement("TD");
            td.innerHTML = bodyCols[c];
            tr.appendChild(td);
        }

        tr.lastElementChild.firstElementChild.addEventListener('click', function(e) {
            deleteLogItem(this.parentNode.parentNode.id);
        });

        tbody.appendChild(tr)
    }

    log.appendChild(tbody);
}
document.getElementById('view-log-btn').addEventListener('click', loadLog);

function formatDate(timestamp) {
    var date = new Date(timestamp),
        years = String(date.getFullYear()).slice(2, 4),
        months = date.getMonth() + 1,
        days = date.getDate(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${
        years
    }/${
        addZero(months)
    }/${
        addZero(days)
    } ${
        hours
    }:${
        addZero(minutes)
    } ${
        ampm
    }`;
}

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}

function deleteLogItem(i) {
    var sure = confirm("You about to delete a log item created at " + formatDate(parseInt(i)) + "." + "\nAre you sure?");

    if (sure) {
        // remove from tableItems
        var elem = document.getElementById(i);
        elem.parentNode.removeChild(elem);

        // remove from local storage
        var logItems = JSON.parse(localStorage.getItem("log"));
        for (n in logItems) {
          if (logItems[n].datetime == i) logItems.splice(n, 1);
        }
        localStorage.setItem("log", JSON.stringify(logItems));
    }
}

function deleteAllLogItems() {
    var log = document.getElementById('log'),
        view = document.getElementById('view-log-btn'),
        delete_all = document.getElementById('delete-all-btn');

    log.innerHTML = '';
    localStorage.setItem('log', '[]');

    log.classList.add('d-none');
    view.classList.remove('d-none');
    delete_all.classList.add('d-none');
}
document.getElementById('delete-all-btn').addEventListener('click', deleteAllLogItems);

function downloadLog() {
    if (document.getElementById('obsidian-switch').checked)
        saveToObsidian();
    else {
        const log = localStorage.getItem("log"),
              uri = "data:text/json;charset=utf-8," + encodeURIComponent(log),
              anchor = document.getElementById('download');
        anchor.setAttribute("href", uri);
        anchor.setAttribute("download", "data.json");
        anchor.click();
    }
}
document.getElementById('download-log-btn').addEventListener('click', downloadLog);

function saveToObsidian(entry) {
    const formatFileDate = (date) => {
        return String(date.getFullYear()).slice(2) + addZero(date.getMonth() + 1) + addZero(date.getDate())
    }

    var log = JSON.parse(localStorage.getItem("log")),
        vault = encodeURI(document.getElementById('obsidian-vault').value),
        firstEntryDate = new Date(log[0].datetime),
        lastEntryDate = new Date(log[Object.keys(log).length-1].datetime),
        file = 'bolus ' + formatFileDate(firstEntryDate) + '-' + formatFileDate(lastEntryDate),
        content = '---\ntags:\n  - health/diabetes/bolus\n---\n\nDate|Units|Carbs|BGL|ICR|ISF|Target\n--|--|--|--|--|--|--';

    for (l in log) {
        log[l].datetime = formatDate(log[l].datetime);
        content += '\n' + Object.values(log[l]).join(' | ');
    }

    uri = `obsidian://new?vault=${vault}&file=${file}&content=${encodeURI(content)}&overwrite`;
    window.location.href = uri;
}

function switchObsidian() {
    var checked = document.getElementById('obsidian-switch').checked
        vault = document.getElementById('obsidian-vault');
    localStorage.setItem("obsidian", checked);

    if (checked) vault.parentNode.classList.remove('fade');
    else vault.parentNode.classList.add('fade');
}
document.getElementById('obsidian-switch').addEventListener('click', switchObsidian);

function checkStacking() {
    if (JSON.parse(localStorage.getItem("log")).length < 1) return false;
    
    var now = new Date().getTime(),
        logArray = JSON.parse(localStorage.getItem("log")),
        last = Number(logArray[logArray.length-1].datetime),
        activityLength = 5 * 60 * 60 * 1000, // 5 hours
        since = now - last,
        seconds = new Date(since).getUTCSeconds(),
        minutes = new Date(since).getUTCMinutes(),
        hours = new Date(since).getUTCHours();

    var count = '';
    if (hours) count = hours + parseFloat((minutes/60).toFixed(1)) + 'h';
    else if (minutes) count = minutes + 'm';
    else count = seconds + 's';

    if (since < activityLength) return count;
    else return false;
}

function displayStacking() {
    if (checkStacking()) {
        document.getElementById('last-dose').innerHTML = 'dose ' + checkStacking() + ' ago';
        document.getElementById('units').classList.remove("text-primary");
        document.getElementById('units').classList.add("text-danger");
    }
    else {
        document.getElementById('last-dose').innerHTML = '';
        document.getElementById('units').classList.remove("text-danger");
        document.getElementById('units').classList.add("text-primary");
    }
}
setInterval(displayStacking, 1000);