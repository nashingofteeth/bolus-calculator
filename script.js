(() => {
  // load local storage
  const storedValues = [...document.querySelectorAll(".store")];
  for (s in storedValues)
    storedValues[s].value = localStorage.getItem(storedValues[s].id);

  // restore Obsidian save switch state
  if (localStorage.getItem("obsidian") === "true") {
    document.getElementById("obsidian-switch").checked = true;
    document
      .getElementById("obsidian-vault")
      .parentNode.classList.remove("fade");
  }

  //initialize log
  if (!localStorage.getItem("log")) localStorage.setItem("log", "[]");

  updateFields();
  displayStacking();

  // set focus on relevant field
  const icr = document.getElementById("icr").value;
  const isf = document.getElementById("isf").value;
  const target = document.getElementById("target").value;

  if ((icr === false && isf === false && target === false) || icr === false)
    document.getElementById("icr").focus();
  else if ((isf === false && target === false) || isf === false)
    document.getElementById("isf").focus();
  else if (target === false) document.getElementById("target").focus();
})();

//add carb fields
function addField() {
  const firstCarb = document.getElementById("carb");
  const newCarb = firstCarb.cloneNode();
  newCarb.classList.remove("term", "store");
  newCarb.value = "";
  newCarb.id = `carb${[...document.querySelectorAll(".carbs")].length + 1}`;
  firstCarb.parentNode.appendChild(newCarb);
  newCarb.focus();
}
document.getElementById("add-btn").addEventListener("click", addField);

document.addEventListener("keydown", (event) => {
  const field = document.activeElement;

  //backspace - delete carb
  if (event.key === 'Backspace' || event.key === 'Delete') {
    if (field.value === "" && /carb/.test(field.id) && field.id !== "carb") {
      event.preventDefault();
      field.previousElementSibling.focus();
      field.remove();
    }
  }
  //enter - create carb
  if (event.key === 'Enter') {
    if (/carb/.test(field.id)) {
      event.preventDefault();
      addField();
    }
  }
});

function clearFields() {
  const carbs = [...document.querySelectorAll(".carbs")];
  for (i in carbs) {
    if (i === "0") carbs[i].value = "";
    else carbs[i].parentNode.removeChild(carbs[i]);
  }
  document.getElementById("bg").value = "";

  updateFields();
}
document.getElementById("clear-btn").addEventListener("click", clearFields);

function updateFields() {
  storeValues();
  if (validFields()) calcUnits();
}
document.addEventListener("keyup", updateFields);

function storeValues() {
  for (const input of [...document.querySelectorAll(".store")]) {
    localStorage.setItem(
      input.id,
      input.id === "carb" ? addCarbs() : input.value
    );
  }
}

function validFields() {
  const requiredFields = [...document.querySelectorAll(".required")];
  let hasTerms = true;
  for (const required of requiredFields) {
    if (
      !required.value ||
      Number.parseInt(required.value) < Number.parseInt(required.min)
    ) {
      required.classList.add("is-invalid");
      if (required.classList.contains("term")) hasTerms = false;
    } else required.classList.remove("is-invalid");
  }

  const elems = [
    ...document.querySelectorAll(".dose .form-control, .dose .btn"),
  ];
  if (hasTerms) {
    for (const elem of elems) elem.removeAttribute("disabled");
    return true;
  }
  for (const elem of elems) elem.setAttribute("disabled", "");
  document.getElementById("units").value = "";
  document.getElementById("bg").placeholder = "";
  return false;
}

function calcUnits() {
  const carbs = addCarbs();
  const bg = Number.parseInt(document.getElementById("bg").value);
  const icr = Number.parseFloat(document.getElementById("icr").value);
  const isf = Number.parseInt(document.getElementById("isf").value);
  const target = Number.parseInt(document.getElementById("target").value);

  // set current BGL placeholder
  document.getElementById("bg").placeholder = `if > ${target}`;

  //use ratios to calulate units
  let units = 0;

  if (carbs) {
    if (bg > target) {
      units = (bg - target) / isf + carbs / icr;
    } else {
      units = carbs / icr;
    }
  } else if (bg > target) {
    units = (bg - target) / isf;
  }

  document.getElementById("units").value = Math.round(units * 10) / 10;
}

function addCarbs() {
  return [...document.querySelectorAll(".carbs")].reduce((total, carb) =>
    total + Number.parseInt(carb.value || 0), 0) || "";
}

function logDose() {
  const icr = document.getElementById("icr").value;
  const isf = document.getElementById("isf").value;
  const target = document.getElementById("target").value;
  const carbs = addCarbs() || 0;
  const bg = document.getElementById("bg").value || target;
  const units = Math.round(document.getElementById("units").value);
  const datetime = new Date().getTime();

  // write log entry object
  const entry = {
    datetime: datetime,
    units: units,
    carbs: carbs,
    bg: bg,
    icr: icr,
    isf: isf,
    target: target,
  };

  const log = JSON.parse(localStorage.getItem("log"));

  // add log item
  log.push(entry);
  localStorage.setItem("log", JSON.stringify(log));
  if (document.getElementById("log").innerHTML) loadLog(log);

  clearFields();
  displayStacking();
}
document.getElementById("log-btn").addEventListener("click", logDose);

function loadLog() {
  const o = JSON.parse(localStorage.getItem("log"));
  const log = document.getElementById("log");
  if (log.innerHTML) log.innerHTML = "";
  log.classList.remove("d-none");

  document.getElementById("view-log-btn").classList.add("d-none");
  document.getElementById("delete-all-btn").classList.remove("d-none");

  if (o.length < 1) {
    log.innerHTML =
      '<span class="invalid-feedback d-block">No log items...</span>';
    return;
  }

  // create log headers
  const thead = document.createElement("THEAD");
  const tr = document.createElement("TR");

  tr.setAttribute("id", "logHeader");
  thead.appendChild(tr);

  const headCols = [
    "Date",
    "Units",
    "Carbs",
    "BGL",
    "ICR",
    "ISF",
    "Target",
    "",
  ];

  for (c in headCols) {
    const th = document.createElement("TH");
    const h = document.createTextNode(headCols[c]);

    th.setAttribute("scope", "col");
    th.appendChild(h);
    tr.appendChild(th);
  }

  log.appendChild(thead);

  // populate log
  o.reverse();
  const tbody = document.createElement("TBODY");

  for (i in o) {
    const tr = document.createElement("TR");
    tr.setAttribute("class", "logItem");
    tr.setAttribute("id", o[i].datetime);

    const bodyCols = [
      formatDate(o[i].datetime),
      o[i].units,
      o[i].carbs,
      o[i].bg,
      o[i].icr,
      o[i].isf,
      o[i].target,
      '<button class="delete-btn btn btn-sm p-1 btn-danger bg-danger" type="button"><i class="bi bi-x-lg"></i></button>',
    ];

    for (c in bodyCols) {
      const td = document.createElement("TD");
      td.innerHTML = bodyCols[c];
      tr.appendChild(td);
    }

    tr.lastElementChild.firstElementChild.addEventListener(
      "click",
      function (e) {
        deleteLogItem(this.parentNode.parentNode.id);
      },
    );

    tbody.appendChild(tr);
  }

  log.appendChild(tbody);
}
document.getElementById("view-log-btn").addEventListener("click", loadLog);

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const years = String(date.getFullYear()).slice(2, 4);
  const months = date.getMonth() + 1;
  const days = date.getDate();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${years}/${addZero(months)}/${addZero(days)} ${hours}:${addZero(
    minutes,
  )} ${ampm}`;
}

function addZero(i) {
  if (i < 10) {
    return `0${i}`;
  }
  return i;
}

function deleteLogItem(i) {
  const sure = confirm(
    `You about to delete a log item created at ${formatDate(Number.parseInt(i))}.\nAre you sure?`,
  );

  if (sure) {
    // remove from tableItems
    const elem = document.getElementById(i);
    elem.parentNode.removeChild(elem);

    // remove from local storage
    const logItems = JSON.parse(localStorage.getItem("log"));
    for (n in logItems) {
      if (logItems[n].datetime === i) logItems.splice(n, 1);
    }
    localStorage.setItem("log", JSON.stringify(logItems));
  }
}

function deleteAllLogItems() {
  const log = document.getElementById("log");
  const view = document.getElementById("view-log-btn");
  const delete_all = document.getElementById("delete-all-btn");

  log.innerHTML = "";
  localStorage.setItem("log", "[]");

  log.classList.add("d-none");
  view.classList.remove("d-none");
  delete_all.classList.add("d-none");
}
document
  .getElementById("delete-all-btn")
  .addEventListener("click", deleteAllLogItems);

function downloadLog() {
  if (document.getElementById("obsidian-switch").checked) saveToObsidian();
  else {
    const log = localStorage.getItem("log");
    const uri = `data:text/json;charset=utf-8,${encodeURIComponent(log)}`;
    const anchor = document.getElementById("download");
    anchor.setAttribute("href", uri);
    anchor.setAttribute("download", "data.json");
    anchor.click();
  }
}
document
  .getElementById("download-log-btn")
  .addEventListener("click", downloadLog);

function saveToObsidian(entry) {
  const formatFileDate = (date) => {
    return (
      String(date.getFullYear()).slice(2) +
      addZero(date.getMonth() + 1) +
      addZero(date.getDate())
    );
  };

  const log = JSON.parse(localStorage.getItem("log"));
  const vault = encodeURI(document.getElementById("obsidian-vault").value);
  const firstEntryDate = new Date(log[0].datetime);
  const lastEntryDate = new Date(log[Object.keys(log).length - 1].datetime);
  const file = `archive/bolus ${formatFileDate(firstEntryDate)}-${formatFileDate(lastEntryDate)}`;
  let content =
    "---\ntags:\n  - records/health/bolus\n---\n\nDate|Units|Carbs|BGL|ICR|ISF|Target\n--|--|--|--|--|--|--";

  for (l in log) {
    log[l].datetime = formatDate(log[l].datetime);
    content += `\n${Object.values(log[l]).join(" | ")}`;
  }

  uri = `obsidian://new?vault=${vault}&file=${file}&content=${encodeURI(content)}&overwrite`;
  window.location.href = uri;
}

function switchObsidian() {
  const checked = document.getElementById("obsidian-switch").checked;
  vault = document.getElementById("obsidian-vault");
  localStorage.setItem("obsidian", checked);

  if (checked) vault.parentNode.classList.remove("fade");
  else vault.parentNode.classList.add("fade");
}
document
  .getElementById("obsidian-switch")
  .addEventListener("click", switchObsidian);

function checkStacking() {
  if (JSON.parse(localStorage.getItem("log")).length < 1) return false;

  const now = new Date().getTime();
  const logArray = JSON.parse(localStorage.getItem("log"));
  const last = Number(logArray[logArray.length - 1].datetime);
  const activityLength = 5 * 60 * 60 * 1000; // 5 hours
  const since = now - last;
  const seconds = new Date(since).getUTCSeconds();
  const minutes = new Date(since).getUTCMinutes();
  const hours = new Date(since).getUTCHours();

  let count = "";
  if (hours) count = `${hours + Number.parseFloat((minutes / 60).toFixed(1))}h`;
  else if (minutes) count = `${minutes}m`;
  else count = `${seconds}s`;

  if (since < activityLength) return count;
  return false;
}

function displayStacking() {
  if (checkStacking()) {
    document.getElementById("last-dose").innerHTML =
      `dose ${checkStacking()} ago`;
    document.getElementById("units").classList.remove("text-primary");
    document.getElementById("units").classList.add("text-danger");
  } else {
    document.getElementById("last-dose").innerHTML = "";
    document.getElementById("units").classList.remove("text-danger");
    document.getElementById("units").classList.add("text-primary");
  }
}
setInterval(displayStacking, 1000);
