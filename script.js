// load local storage
document.getElementById('icr').value = localStorage.getItem("icr");
document.getElementById('isf').value = localStorage.getItem("isf");
document.getElementById('target').value = localStorage.getItem("target");
document.getElementById('carb1').value = localStorage.getItem("carbs");
document.getElementById('bg').value = localStorage.getItem("bg");
if (localStorage.getItem("log")) {
    var logArray = JSON.parse(localStorage.getItem("log"));
    parseLog(logArray);
}
else {
    var log = [];
    localStorage.setItem("log", JSON.stringify(log));
}

var icr = document.getElementById('icr').value,
    isf = document.getElementById('isf').value,
    target = document.getElementById('target').value;

// set focus on relavent field
if ((icr == false && isf == false && target == false) || icr == false) document.getElementById('icr').focus();
else if ((isf == false && target == false) || isf == false) document.getElementById('isf').focus();
else if (target == false) document.getElementById('target').focus();
else document.getElementById('carb1').focus();

//add carb fields
var carbI = 2;
var carbsA = ["carb1"];
function addField() {
    document.getElementById('carbs').insertAdjacentHTML("beforeend",
        "<input type='number' pattern='[0-9]*' inputmode='numeric' placeholder='carbs' class='carb' id='carb" +
        carbI++ +
        "'>");
    document.getElementById("carb"+parseInt(carbI-1)).focus();
    carbsA.push("carb"+parseInt(carbI-1));
};

function addCarbs() {
    var carbs = 0;
    for (i = 0; i < carbsA.length; i++) {
        var carb = document.getElementById(carbsA[i]).value;
        if (carb == false) carb = 0;
        carbs += parseInt(carb);
    }
    return carbs;
}

setInterval(function() {
    var carbs = document.getElementById('carbs').value,
        bg = document.getElementById('bg').value,
        icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = parseInt(document.getElementById('target').value);

    // save ratios locally
    localStorage.setItem("icr", icr);
    localStorage.setItem("isf", isf);
    localStorage.setItem("target", target);
    localStorage.setItem("bg", bg);

    // set current BGL placeholder
    if (isNaN(target) == false) document.getElementById('bg').placeholder = "if > " + target;
    else document.getElementById('bg').placeholder = "";

    //add up carbs
    var carbs = addCarbs();

    if (carbs == 0) localStorage.setItem("carbs", "");
    else localStorage.setItem("carbs", carbs);

    //use ratios to calulate dose
    if (carbs != null && bg > target) var dose = ((bg - target) / isf) + (carbs / icr);
    else if (carbs != null) var dose = carbs / icr;
    else if (bg > target) var dose = (bg - target) / isf;

    document.getElementById('dose').value = Math.round(dose);
    document.getElementById('unrounded').innerHTML = dose;

}, 100);

// hotkeys
document.addEventListener('keydown', function (event) {

    //backspace - delete carb
    if (event.keyCode == 8 || event.keyCode == 46) {
        var fieldName = document.activeElement.id,
            field = document.getElementById(fieldName);
        if (field.value == "" && /carb/.test(fieldName) && fieldName != 'carb1') {
            event.preventDefault();
            var fIndex = carbsA.indexOf(fieldName),
                fieldId = fieldName[fieldName.length -1];
            carbsA.splice(fIndex, 1);
            field.parentNode.removeChild(field);
            document.getElementById(carbsA[fIndex-1]).focus();
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

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function parseLog(o) {
    var log = document.getElementById("log");
    if (log.innerHTML) log.innerHTML = "";

    // create log headers
    var y = document.createElement("TR");
    y.setAttribute("id", "logHeader");

    var headers = ['Dose', 'Carbs', 'BGL', 'ICR', 'ISF', 'Target', 'Time'];

    for (item in headers) {
        var z = document.createElement("TH");
        var t = document.createTextNode(headers[item]);
        z.appendChild(t);
        y.appendChild(z);
    }
    log.appendChild(y);

    // populate log
    // o.sort(function(a, b){return o[a].id - o[b].id});
    for (i = 0; i < o.length; i++) {

      var y = document.createElement("TR");
      y.setAttribute("class", "logItem");
      y.setAttribute("id", "logItem"+o[i].id);

      var tableItems = [o[i].dose, o[i].carbs, o[i].bg, o[i].icr, o[i].isf, o[i].target, addZero(o[i].hour) + ":" + addZero(o[i].minute) + ":" + addZero(o[i].second) + ", " + addZero(o[i].month) + "/" + addZero(o[i].date) + "/" + o[i].year, "<a href='javascript:deleteLogItem("+ o[i].id + ");'>delete</a>"];

      for (item in tableItems) {
          var z = document.createElement("TD");
          var t = document.createTextNode(tableItems[item]);
          z.appendChild(t);
          y.appendChild(z);
      }

      log.appendChild(y);

      // convert delete link into html
      document.querySelector("#logItem"+o[i].id).childNodes[7].innerHTML = document.querySelector("#logItem"+o[i].id).childNodes[7].innerText;
    }
}
function deleteLogItem(i) {
    // remove from tableItems
    var elem = document.getElementById("logItem"+i);
    elem.parentNode.removeChild(elem);

    // remove from local storage
    var logItems = JSON.parse(localStorage.getItem("log"));
    for (n = 0; n < logItems.length; n++) {
      if (logItems[n].id == i) logItems.splice(n, 1);
    }
    localStorage.setItem("log", JSON.stringify(logItems));
}

function log() {

    var d = new Date();
    var M = d.getMonth();
    var D = d.getDate();
    var Y = d.getFullYear();

    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();

    var carbs = document.getElementById('carbs').value,
        bg = document.getElementById('bg').value,
        icr = document.getElementById('icr').value,
        isf = document.getElementById('isf').value,
        target = parseInt(document.getElementById('target').value),
        dose = document.getElementById('dose').value;

    // write log entry object
    var dose = {dose:parseInt(dose), carbs:addCarbs(), bg:parseInt(bg), icr:parseInt(icr), isf:parseInt(isf), target:target, month:M, date:D, year:Y, hour:h, minute:m, second:s, id:String(M)+String(D)+String(Y)+String(h)+String(m)+String(s)};

    var log = JSON.parse(localStorage.getItem("log"));

    if (log.length > 1 && dose.id == log[log.length-1].id) return false;
    else {
        // add log item
        log.push(dose);
        parseLog(log);
        localStorage.setItem("log", JSON.stringify(log));

        // clear fields
        var carbs = document.querySelectorAll('.carb');
        for (i = 0; i < carbs.length; i++) carbs[i].value = '';
        document.getElementById('bg').value = '';
    }
}
