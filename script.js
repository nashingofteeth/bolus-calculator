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
        document.getElementById('log-btn').innerHTML = "last dose active for " + checkStacking() + " more minutes";
        document.getElementById('log-btn').classList.remove("btn-primary");
        document.getElementById('log-btn').classList.add("btn-danger");
        document.getElementById('units').classList.remove("text-primary");
        document.getElementById('units').classList.add("text-danger");
        // document.getElementById('stacking').classList.add('d-block');
    }
    else {
        document.getElementById('log-btn').innerHTML = "log dose";
        document.getElementById('log-btn').classList.remove("btn-danger");
        document.getElementById('log-btn').classList.add("btn-primary");
        document.getElementById('units').classList.remove("text-danger");
        document.getElementById('units').classList.add("text-primary");
        // document.getElementById('stacking').classList.remove('d-block');
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
        var fieldName = document.activeElement.id,
            field = document.getElementById(fieldName);
        if (field.value == "" && /carb/.test(fieldName) && fieldName != 'carb1') {
            event.preventDefault();
            var fIndex = carbsA.indexOf(fieldName);
            carbsA.splice(fIndex, 1);
            field.parentNode.removeChild(field);
            document.getElementById(carbsA[fIndex-1]).focus();
        }

        // switch between carbs and bgl
        else if (field.value == "" && fieldName == "bg") {
            event.preventDefault();
            document.getElementById(carbsA[carbsA.length-1]).focus();
        }
        else if (field.value == "" && fieldName == "carb1") {
            event.preventDefault();
            document.getElementById('bg').focus();
        }
    }

    //enter - create carb
    if(event.keyCode == 13) {
        var fieldName = document.activeElement.id;
        if (/carb/.test(fieldName)) {
            event.preventDefault();
            addField();
        }
    }
});

//add carb fields
var carbI = 1;
var carbsA = ["carb1"];
function addField() {
    carbI++;
    document.getElementById('carbs').insertAdjacentHTML('beforeend',
        '<input type="number" class="carb form-control form-control-lg mb-2" pattern="[0-9]*" placeholder="carbs" class="carb" id="carb' +
        carbI +
        '">');
    document.getElementById("carb" + carbI).focus();
    carbsA.push("carb" + carbI);
};

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
    var carbs = document.querySelectorAll('.carb');
    for (i = 0; i < carbs.length; i++) {
        carbs[i].value = '';
        if (i != 0) {
            var fIndex = carbsA.indexOf(carbs[i]);
            carbsA.splice(fIndex, 1);
            carbs[i].parentNode.removeChild(carbs[i]);
        }
    }
    document.getElementById('bg').value = '';
}

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
    if (!JSON.parse(localStorage.getItem("log")).length) return false;
    var d = new Date();
    var D = d.getDate();
    var h = d.getHours();
    var m = d.getMinutes();
    var thisTime = (D*1440) + (h*60) + m;

    var logArray = JSON.parse(localStorage.getItem("log"));
    var lastMonth = Number(logArray[logArray.length-1].month);
    var lastDay = Number(logArray[logArray.length-1].date);
    var lastHour = Number(logArray[logArray.length-1].hour);
    var lastMinute = Number(logArray[logArray.length-1].minute);

    // check if bridging months
    if (lastDay == DiM(lastMonth) && D == 1) lastDay = 0;

    var lastTime = (lastDay*1440) + (lastHour*60) + lastMinute;

    var activityLength = 300;
    var timeLeft = activityLength - (thisTime - lastTime);

    if (timeLeft <= activityLength && timeLeft > 0) return timeLeft;
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

function logSession() {

    var d = new Date();
    var M = addZero(d.getMonth()+1);
    var D = addZero(d.getDate());
    var Y = d.getFullYear();

    var h = addZero(d.getHours());
    var m = addZero(d.getMinutes());
    var s = addZero(d.getSeconds());

    var icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = parseInt(document.getElementById('target').value),
        carbs = document.getElementById('carbs').value,
        bg = document.getElementById('bg').value ? document.getElementById('bg').value : target,
        units = Math.round(document.getElementById('units').value);

    // write log entry object
    var entry = {
        units: parseInt(units),
        carbs: addCarbs(),
        bg: parseInt(bg),
        icr: parseFloat(icr),
        isf: parseInt(isf),
        target: target,
        month: M,
        date: D,
        year: Y,
        hour: h,
        minute: m,
        second: s,
        id: M+""+D+""+Y+""+h+""+m+""+s
    };

    var log = JSON.parse(localStorage.getItem("log"));

    // check if log item already exists
    if (log.length && entry.id == log[log.length-1].id) return false;

    // add log item
    log.push(entry);
    localStorage.setItem("log", JSON.stringify(log));
    if(document.getElementById('log').innerHTML) loadLog(log);

    // clear inputs
    clearFields();
}

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

      var tableItems = [o[i].hour + ":" + o[i].minute + ":" + o[i].second + "\u000a" + o[i].month + "/" + o[i].date + "/" + String(o[i].year).substring(2), o[i].units, o[i].carbs, o[i].bg, o[i].icr, o[i].isf, o[i].target, '<button class="btn btn-sm btn-danger bg-danger" type="button" onclick="deleteLogItem(this.parentNode.parentNode.id)">X</button>'];

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

function downloadLog() {
    const log = localStorage.getItem("log"),
          uri = "data:text/json;charset=utf-8," + encodeURIComponent(log),
          anchor = document.getElementById('download');
    anchor.setAttribute("href", uri);
    anchor.setAttribute("download", "data.json");
    anchor.click();
}

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

// get # of days in month
function DiM (month) {
    var Y = new Date().getFullYear();
    return new Date(Y, month, 0).getDate();
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}