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

    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value;

    // set focus on relevant field
    if ((icr == false && isf == false && target == false) || icr == false) document.getElementById('icr').focus();
    else if ((isf == false && target == false) || isf == false) document.getElementById('isf').focus();
    else if (target == false) document.getElementById('target').focus();
    else document.getElementById('carb1').focus();
})();

setInterval(function() {
    // check for stacking
    if (checkStacking()) {
        document.getElementById('log-btn').innerHTML = 'log dose<small class="badge fw-normal">(last dose ' + checkStacking() + ' ago)</small>';
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

    var carbs = addCarbs(),
        bg = document.getElementById('bg').value,
        icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = document.getElementById('target').value;

    storeValues(carbs, bg, icr, isf, target);

    if ( checkRequired() )
        calcUnits(carbs, bg, icr, isf, target);

}, 100);

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

        // switch between carbs and bgl
        else if (field.value == "" && fieldId == "bg") {
            event.preventDefault();
            fields[fields.length-1].focus();
        }
        else if (field.value == "" && fieldId == "carb1") {
            event.preventDefault();
            document.getElementById('bg').focus();
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
}
document.getElementById('clear-btn').addEventListener('click', clearFields);

function checkRequired() {
    var required = [...document.querySelectorAll('.required')],
        valid = true;
    for (r in required) {
        if ( !required[r].value || required[r].value < required[r].min ) {
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

    if (hours) count = hours + '.' + Math.round(60/minutes) + 'h';
    else if (minutes ) count = minutes + 'm';
    else count = seconds + 's';

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
    console.log(log);
    localStorage.setItem("log", JSON.stringify(log));
    if(document.getElementById('log').innerHTML) loadLog(log);

    // clear inputs
    clearFields();
}
document.getElementById('log-btn').addEventListener('click', logDose);

function loadLog(o) {
    var log = document.getElementById("log");
    if (log.innerHTML) log.innerHTML = "";
    log.classList.remove('d-none');

    // create log headers
    var y = document.createElement("TR");
    y.setAttribute("id", "logHeader");

    var headers = ['Time', 'Units', 'Carbs', 'BGL', 'ICR', 'ISF', 'Target'];

    for (item in headers) {
        var z = document.createElement("TH");
        z.setAttribute("scope", "col");
        var t = document.createTextNode(headers[item]);
        z.appendChild(t);
        y.appendChild(z);
    }
    if (o.length > 0) log.appendChild(y);
    else log.innerHTML = '<span class="invalid-feedback d-block">No log items...</span>';

    // populate log
    o.reverse();
    for (i = 0; i < o.length; i++) {

      var y = document.createElement("TR");
      y.setAttribute("class", "logItem");
      y.setAttribute("id", o[i].id);

      var tableItems = [
        o[i].datetime,
        o[i].units,
        o[i].carbs,
        o[i].bg,
        o[i].icr,
        o[i].isf,
        o[i].target,
        '<button class="btn btn-sm btn-danger bg-danger" type="button" onclick="deleteLogItem(this.parentNode.parentNode.id)">X</button>'
        ];

      for (item in tableItems) {
          var z = document.createElement("TD");
          var t = document.createTextNode(tableItems[item]);
          z.appendChild(t);
          y.appendChild(z);
      }

      log.appendChild(y);

      // convert delete link into html
      document.getElementById(o[i].id).childNodes[7].innerHTML = document.getElementById(o[i].id).childNodes[7].innerText;
    }
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
    var M = i.substring(0,2);
    var D = i.substring(2,4);
    var Y = i.substring(6,8);
    var h = i.substring(10,8);
    var m = i.substring(12,10);
    var sure = confirm("You about to delete a log item created on " + M + "/" + D + "/" + Y + " at " + h + ":" + m + "." + "\nAre you sure?");

    if (sure) {
        // remove from tableItems
        var elem = document.getElementById(i);
        elem.parentNode.removeChild(elem);

        // remove from local storage
        var logItems = JSON.parse(localStorage.getItem("log"));
        for (n = 0; n < logItems.length; n++) {
          if (logItems[n].id == i) logItems.splice(n, 1);
        }
        localStorage.setItem("log", JSON.stringify(logItems));
    }
}