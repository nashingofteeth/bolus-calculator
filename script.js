(function() {
    // load local storage
    document.getElementById('icr').value = localStorage.getItem("icr");
    document.getElementById('isf').value = localStorage.getItem("isf");
    document.getElementById('target').value = localStorage.getItem("target");
    document.getElementById('carb1').value = localStorage.getItem("carbs");
    document.getElementById('bg').value = localStorage.getItem("bg");
    if (!localStorage.getItem("log")) {
        var logInit = [];
        localStorage.setItem("log", JSON.stringify(logInit));
    }

    checkFields();
    displayStacking();

    // set focus on relevant field
    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value;

    if ((icr == false && isf == false && target == false) || icr == false) document.getElementById('icr').focus();
    else if ((isf == false && target == false) || isf == false) document.getElementById('isf').focus();
    else if (target == false) document.getElementById('target').focus();
    else document.getElementById('carb1').focus();
})();


// hotkeys
document.addEventListener('keyup', function (event) {
    //backspace - delete carb
    if (event.keyCode == 8 || event.keyCode == 46) {
        var fieldId = document.activeElement.id,
            field = document.getElementById(fieldId),
            fields = [...document.querySelectorAll('.carb')];

        if (field.value == "" && /carb/.test(fieldId) && fieldId != 'carb1') {
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

    else checkFields();
});

function checkFields() {
    var carbs = addCarbs(),
        bg = document.getElementById('bg').value,
        icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value;

    storeValues(carbs, bg, icr, isf, target);

    if ( checkRequired() )
        calcUnits(carbs, bg, icr, isf, target);
}

//add carb fields
function addField() {
    fieldNumber = [...document.querySelectorAll('.carb')].length + 1;
    document.getElementById('carbs').insertAdjacentHTML('beforeend',
        '<input type="number" class="carb form-control form-control-lg mb-2" pattern="[0-9]*" placeholder="carbs" class="carb" id="carb' +
        fieldNumber +
        '">');
    document.getElementById("carb" + fieldNumber).focus();
};
document.getElementById('add-btn').addEventListener('click', addField);


function addCarbs() {
    var totalCarbs = 0,
        carbs = [...document.querySelectorAll('.carb')];
    for (c in carbs) {
        var carb = carbs[c].value;
        if (!carb) carb = 0;
        totalCarbs += parseInt(carb);
    }

    return totalCarbs;
}

function calcUnits(carbs, bg, icr, isf, target) {
    var carbs = addCarbs(),
        bg = parseInt(bg),
        icr = parseFloat(icr),
        isf = parseInt(isf),
        target = parseInt(target);

    // set current BGL placeholder
    document.getElementById('bg').placeholder = "if > " + target;

    //use ratios to calulate units
    if (carbs && bg > target) var units = ((bg - target) / isf) + (carbs / icr);
    else if (carbs) var units = carbs / icr;
    else if (bg > target) var units = (bg - target) / isf;
    else var units = 0;
    
    document.getElementById('units').value = Math.round(units*10)/10;
}

function clearFields() {
    var carbs = [...document.querySelectorAll('.carb')];
    for (i = 0; i < carbs.length; i++) {
        if (i == 0) carbs[i].value = '';
        else carbs[i].parentNode.removeChild(carbs[i]);
    }
    document.getElementById('bg').value = '';
    checkFields();
}
document.getElementById('clear-btn').addEventListener('click', clearFields);

function checkRequired() {
    var required = [...document.querySelectorAll('.required')],
        valid = true;
    for (r in required) {
        if ( !required[r].value || parseInt(required[r].value) < parseInt(required[r].min) ) {
            required[r].classList.add('is-invalid');
            valid = false;
        }
        else required[r].classList.remove('is-invalid');
    }

    var elems = [...document.querySelectorAll('.dose .form-control, .dose .btn')];
    if ( valid ) {
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

    if (hours) count = hours + parseFloat((minutes/60).toFixed(1)) + 'h';
    else if (minutes) {
        count = minutes + 'm';
        document.getElementById('log-btn').removeAttribute('disabled');
    }
    else {
        count = seconds + 's';
        document.getElementById('log-btn').setAttribute('disabled', '');
    }

    if (since < activityLength) return count;
    else return false;
}

function storeValues(carbs, bg, icr, isf, target) {
    localStorage.setItem("icr", icr);
    localStorage.setItem("isf", isf);
    localStorage.setItem("target", target);
    localStorage.setItem("bg", bg);
    if (!carbs) localStorage.setItem("carbs", "");
    else localStorage.setItem("carbs", carbs);
}

function displayStacking() {
    if (checkStacking()) {
        document.getElementById('log-btn').innerHTML = 'log dose<small class="badge fw-normal position-static">(last dose ' + checkStacking() + ' ago)</small>';
        document.getElementById('log-btn').classList.remove("btn-primary");
        document.getElementById('log-btn').classList.add("btn-danger");
        document.getElementById('units').classList.remove("text-primary");
        document.getElementById('units').classList.add("text-danger");
    }
    else {
        document.getElementById('log-btn').innerHTML = "log dose";
        document.getElementById('log-btn').classList.remove("btn-danger");
        document.getElementById('log-btn').classList.add("btn-primary");
        document.getElementById('units').classList.remove("text-danger");
        document.getElementById('units').classList.add("text-primary");
    }
}
setInterval(displayStacking, 1000);

function logDose() {
    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = parseInt(document.getElementById('target').value),
        carbs = document.getElementById('carbs').value,
        bg = document.getElementById('bg').value ? document.getElementById('bg').value : target,
        units = Math.round(document.getElementById('units').value),
        datetime = new Date().getTime();

    // write log entry object
    var entry = {
        units: parseInt(units),
        carbs: addCarbs(),
        bg: parseInt(bg),
        icr: parseFloat(icr),
        isf: parseInt(isf),
        target: target,
        datetime: datetime
    };

    var log = JSON.parse(localStorage.getItem("log"));

    // add log item
    log.push(entry);
    localStorage.setItem("log", JSON.stringify(log));
    if(document.getElementById('log').innerHTML) loadLog(log);

    // clear inputs
    clearFields();
    displayStacking();
}
document.getElementById('log-btn').addEventListener('click', logDose);

function loadLog(o) {
    var log = document.getElementById("log");
    if (log.innerHTML) log.innerHTML = "";
    log.classList.remove('d-none');
    
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
            '<button class="delete-btn btn btn-sm p-1 btn-danger bg-danger" type="button">&times;</button>'
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
document.getElementById('view-log-btn').addEventListener('click', function(e) {
    loadLog(JSON.parse(localStorage.getItem('log')));
    this.parentNode.removeChild(this);
});

function downloadLog() {
    const log = localStorage.getItem("log"),
          uri = "data:text/json;charset=utf-8," + encodeURIComponent(log),
          anchor = document.getElementById('download');
    anchor.setAttribute("href", uri);
    anchor.setAttribute("download", "data.json");
    anchor.click();
}
document.getElementById('download-log-btn').addEventListener('click', downloadLog);

function deleteLogItem(i) {
    var sure = confirm("You about to delete a log item created at " + formatDate(parseInt(i)) + "." + "\nAre you sure?");

    if (sure) {
        // remove from tableItems
        var elem = document.getElementById(i);
        elem.parentNode.removeChild(elem);

        // remove from local storage
        var logItems = JSON.parse(localStorage.getItem("log"));
        for (n = 0; n < logItems.length; n++) {
          if (logItems[n].datetime == i) logItems.splice(n, 1);
        }
        localStorage.setItem("log", JSON.stringify(logItems));
    }
}

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
        addZero(hours)
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