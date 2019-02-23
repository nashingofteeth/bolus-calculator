// load local storage
document.getElementById('icr').value = localStorage.getItem("icr");
document.getElementById('isf').value = localStorage.getItem("isf");
document.getElementById('target').value = localStorage.getItem("target");
document.getElementById('carb1').value = localStorage.getItem("carbs");
document.getElementById('bg').value = localStorage.getItem("bg");

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
    var carbs = 0;
    for (i = 0; i < carbsA.length; i++) {
        var carb = document.getElementById(carbsA[i]).value;
        if (carb == false) carb = 0;
        carbs += parseInt(carb);

        if (carbs == 0) localStorage.setItem("carbs", "");
        else localStorage.setItem("carbs", carbs);
    }

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

function reset() {
    document.getElementById('carb1').value = '';
    document.getElementById('bg').value = '';
}
