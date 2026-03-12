const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const task = tehtavat[id];

const title = document.getElementById("taskTitle");
const instructions = document.getElementById("taskInstructions");
const pdfLink = document.getElementById("pdfLink");
const downloadBtn = document.getElementById("downloadBtn");
const notes = document.getElementById("notes");
const clearBtn = document.getElementById("clearBtn");

/* otsikko */

title.textContent = task.title;

/* ohjeet */

task.instructions.forEach(function (text) {
  const li = document.createElement("li");
  li.textContent = text;

  instructions.appendChild(li);
});

/* pdf */

pdfLink.href = task.pdf;

/* -------- AUTOMAATTINEN TALLENNUS -------- */

const storageKey = "digiopo_notes_" + id;

/* lataa tallennettu teksti */

const savedText = localStorage.getItem(storageKey);

if (savedText) {
  notes.value = savedText;
}

/* tallenna kun oppilas kirjoittaa */

notes.addEventListener("input", function () {
  localStorage.setItem(storageKey, notes.value);
});

/* -------- WORD LATAUS -------- */

function downloadWord() {
  var text = notes.value;

  var html =
    "<html>" +
    "<head><meta charset='utf-8'></head>" +
    "<body>" +
    "<h1>" +
    task.title +
    "</h1>" +
    "<p>" +
    text +
    "</p>" +
    "</body>" +
    "</html>";

  var blob = new Blob(["\ufeff", html], { type: "application/msword" });

  var url = URL.createObjectURL(blob);

  var link = document.createElement("a");

  link.href = url;
  link.download = task.title + ".doc";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* nappi */

downloadBtn.addEventListener("click", downloadWord);
/* TYHJENNÄ VASTAUS */

clearBtn.addEventListener("click", function () {
  const confirmClear = confirm("Haluatko varmasti tyhjentää vastauksesi?");

  if (confirmClear) {
    notes.value = "";

    localStorage.removeItem(storageKey);
  }
});
/* -------- TEHTÄVIEN NAVIGAATIO -------- */

const prevBtn = document.getElementById("prevTask");
const nextBtn = document.getElementById("nextTask");

const index = tehtavaJarjestys.indexOf(id);

if (index > 0) {
  prevBtn.href = "tehtava.html?id=" + tehtavaJarjestys[index - 1];
} else {
  prevBtn.style.visibility = "hidden";
}

if (index < tehtavaJarjestys.length - 1) {
  nextBtn.href = "tehtava.html?id=" + tehtavaJarjestys[index + 1];
} else {
  nextBtn.style.visibility = "hidden";
}
/* -------- SIVUNAVIGAATIO -------- */

const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

const currentIndex = tehtavaJarjestys.indexOf(id);

if (currentIndex > 0) {
  const prevId = tehtavaJarjestys[currentIndex - 1];

  prevBtn.href = "tehtava.html?id=" + prevId;
  prevBtn.textContent = "← " + tehtavat[prevId].title;
} else {
  prevBtn.style.visibility = "hidden";
}

if (currentIndex < tehtavaJarjestys.length - 1) {
  const nextId = tehtavaJarjestys[currentIndex + 1];

  nextBtn.href = "tehtava.html?id=" + nextId;
  nextBtn.textContent = tehtavat[nextId].title + " →";
} else {
  nextBtn.style.visibility = "hidden";
}
