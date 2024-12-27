(() => {
  // load local storage
  const storedInputs = [...document.querySelectorAll(".store")];
  for (const input of storedInputs) {
    input.value = localStorage.getItem(input.id);
  }

  // restore Obsidian save toggle state
  if (localStorage.getItem("obsidian") === "true") {
    document.getElementById("obsidian-toggle").checked = true;
    document
      .getElementById("obsidian-vault")
      .parentNode.classList.remove("fade");
  }

  //initialize log
  if (!localStorage.getItem("log")) localStorage.setItem("log", "[]");

  updateFields();
  toggleActiveDoseBadge();

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
      input.id === "carb" ? totalCarbs() : input.value
    );
  }
}

function validFields() {
  const requiredFields = [...document.querySelectorAll(".required")];
  let hasTerms = true;
  for (const required of requiredFields) {
    if (
      !required.value ||
      Number(required.value) < Number(required.min)
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
  const carbs = totalCarbs();
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

function totalCarbs() {
  return [...document.querySelectorAll(".carbs")].reduce((total, carb) =>
    total + Number.parseInt(carb.value || 0), 0) || "";
}

const logDose = () => {
  const icr = document.getElementById("icr").value;
  const isf = document.getElementById("isf").value;
  const target = document.getElementById("target").value;
  const carbs = totalCarbs() || 0;
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

  // add log entry
  log.push(entry);
  localStorage.setItem("log", JSON.stringify(log));
  if (document.getElementById("log").innerHTML) showLog(log);

  clearFields();
  toggleActiveDoseBadge();
}
document.getElementById("log-btn").addEventListener("click", logDose);

const deleteLogEntry = (entryId) => {
  const sure = confirm(
    `You about to delete the log entry created at ${formatDate(entryId)}.\nAre you sure?`,
  );

  if (sure) {
    // remove from table
    const elem = document.getElementById(entryId);
    elem.parentNode.removeChild(elem);

    // remove from local storage
    const logEntries = JSON.parse(localStorage.getItem("log"));
    logEntries.splice(logEntries.findIndex(entry => entry.datetime === entryId), 1);
    localStorage.setItem("log", JSON.stringify(logEntries));
  }
}

const deleteAllLogEntries = () => {
  const sure = confirm(
    "You about to delete all log entries.\nAre you sure?",
  );
  if (sure) {
    const log = document.getElementById("log");
    const view = document.getElementById("view-log-btn");
    const deleteAllButton = document.getElementById("delete-all-btn");

    log.innerHTML = "";
    localStorage.setItem("log", "[]");

    log.classList.add("d-none");
    view.classList.remove("d-none");
    deleteAllButton.classList.add("d-none");
  }
}
document
  .getElementById("delete-all-btn")
  .addEventListener("click", deleteAllLogEntries);

const updateLogEntryDateTime = (row) => {
  const input = row.querySelector('.edit-datetime');
  const originalTimestamp = Number(row.id);
  const newTimestamp = new Date(input.value).getTime();

  const sure = confirm(
    `Change entry time from ${formatDate(originalTimestamp)} to ${formatDate(newTimestamp)}?`
  );

  if (sure) {
    const log = JSON.parse(localStorage.getItem("log"));

    const entryIndex = log.findIndex(entry => entry.datetime === originalTimestamp);
    log[entryIndex].datetime = newTimestamp;

    // sort (ascending)
    log.sort((a, b) => a.datetime - b.datetime);

    localStorage.setItem("log", JSON.stringify(log));

    // re-render log
    showLog();
  } else {
    // Reset the input to original value if cancelled
    input.value = formatDateForInput(originalTimestamp);
  }
}

function showLog() {
  const log = JSON.parse(localStorage.getItem("log"));
  if (!log.length) {
    alert("No log data found");
    return;
  }

  const logEl = document.getElementById("log");
  if (logEl.innerHTML) logEl.innerHTML = "";
  logEl.classList.remove("d-none");

  document.getElementById("view-log-btn").classList.add("d-none");
  document.getElementById("delete-all-btn").classList.remove("d-none");

  // create log headers
  const thead = document.createElement("THEAD");
  const tr = document.createElement("TR");

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

  for (const col of headCols) {
    const th = document.createElement("TH");
    const h = document.createTextNode(col);

    th.setAttribute("scope", "col");
    th.appendChild(h);
    tr.appendChild(th);
  }

  logEl.appendChild(thead);

  // populate log
  log.reverse();
  const tbody = document.createElement("TBODY");

  // create log entry delete button
  const deleteBtn = () => {
    const button = document.createElement('button');
    button.className = 'delete-btn btn btn-sm p-1 btn-danger bg-danger';
    button.type = 'button';
    const icon = document.createElement('i');
    icon.className = 'bi bi-x-lg';
    button.appendChild(icon);
    return button.outerHTML;
  };

  // create log entry datetime input
  const datetimeInput = (timestamp) => {
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.className = 'edit-datetime form-control form-control-sm';
    input.step = '1';
    input.setAttribute('value', formatDateForInput(timestamp));
    return input.outerHTML;
  };

  for (const entry of log) {
    const tr = document.createElement("TR");
    tr.setAttribute("id", entry.datetime);

    const bodyCols = [
      datetimeInput(entry.datetime),
      entry.units,
      entry.carbs,
      entry.bg,
      entry.icr,
      entry.isf,
      entry.target,
      deleteBtn(),
    ];

    for (const col of bodyCols) {
      const td = document.createElement("TD");
      td.innerHTML = col;
      tr.appendChild(td);
    }

    tr.querySelector(".delete-btn").addEventListener("click", () => deleteLogEntry(Number(tr.id)));
    tr.querySelector('.edit-datetime').addEventListener("change", () => updateLogEntryDateTime(tr));

    tbody.appendChild(tr);
  }

  logEl.appendChild(tbody);
}
document.getElementById("view-log-btn").addEventListener("click", showLog);

const downloadLog = () => {
  if (document.getElementById("obsidian-toggle").checked) saveToObsidian();
  else {
    try {
      const log = localStorage.getItem("log");
      if (!log || log === "[]") {
        alert("No log data found");
        return;
      }

      const blob = new Blob([log], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = "data.json";
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download log:', error);
    }
  }
}
document
  .getElementById("download-log-btn")
  .addEventListener("click", downloadLog);

function saveToObsidian() {
  const formatFileDate = timestamp => {
    const parts = new Date(timestamp).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).split('/');
    return `${parts[2]}${parts[0]}${parts[1]}`;
  };

  const log = JSON.parse(localStorage.getItem("log"));
  const vault = encodeURI(document.getElementById("obsidian-vault").value);
  const file = `archive/bolus ${formatFileDate(log[0].datetime)}-${formatFileDate(log.at(-1).datetime)}`;
  let content =
    "---\ntags:\n  - records/health/bolus\n---\n\nDate|Units|Carbs|BGL|ICR|ISF|Target\n--|--|--|--|--|--|--";

  for (const entry of log) {
    entry.datetime = formatDate(entry.datetime);
    content += `\n${Object.values(entry).join(" | ")}`;
  }

  uri = `obsidian://new?vault=${vault}&file=${file}&content=${encodeURI(content)}&overwrite`;
  window.location.href = uri;
}

const toggleObsidian = () => {
  const checked = document.getElementById("obsidian-toggle").checked;
  vault = document.getElementById("obsidian-vault");
  localStorage.setItem("obsidian", checked);

  if (checked) vault.parentElement.classList.remove("fade");
  else vault.parentElement.classList.add("fade");
}
document
  .getElementById("obsidian-toggle")
  .addEventListener("click", toggleObsidian);

function activeDose() {
  if (JSON.parse(localStorage.getItem("log")).length < 1) return false;

  const now = new Date().getTime();
  const log = JSON.parse(localStorage.getItem("log"));
  const lastEntry = Number(log.at(-1).datetime);
  if (lastEntry > now) return false;
  const timeout = 5 * 60 * 60 * 1000; // 5 hours
  const sinceLast = now - lastEntry;
  const secondsSince = new Date(sinceLast).getUTCSeconds();
  const minutesSince = new Date(sinceLast).getUTCMinutes();
  const hoursSince = new Date(sinceLast).getUTCHours();

  let count = "";
  if (hoursSince) count = `${hoursSince + Number.parseFloat((minutesSince / 60).toFixed(1))}h`;
  else if (minutesSince) count = `${minutesSince}m`;
  else count = `${secondsSince}s`;

  if (sinceLast < timeout) return count;
  return false;
}

function toggleActiveDoseBadge() {
  if (!activeDose()) {
    document.getElementById("active-dose").innerHTML = "";
    document.getElementById("units").classList.remove("text-danger");
    document.getElementById("units").classList.add("text-primary");
  } else {
    document.getElementById("active-dose").innerHTML =
      `dose ${activeDose()} ago`;
    document.getElementById("units").classList.remove("text-primary");
    document.getElementById("units").classList.add("text-danger");
  }
}
setInterval(toggleActiveDoseBadge, 1000);

// Helpers
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateForInput(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Format as YYYY-MM-DDThh:mm:ss (ISO)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
