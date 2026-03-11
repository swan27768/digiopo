function searchTasks() {
  let input = document.getElementById("searchInput");
  let filter = input.value.toLowerCase();

  let cards = document.getElementsByClassName("task-card");

  for (let i = 0; i < cards.length; i++) {
    let text = cards[i].innerText.toLowerCase();

    if (text.includes(filter)) {
      cards[i].style.display = "";
    } else {
      cards[i].style.display = "none";
    }
  }
}
