const stage = document.querySelector("[data-mascot-stage]");
const items = document.querySelectorAll("[data-item]");

if (stage !== null) {
  items.forEach(function (item) {
    item.addEventListener("click", function () {
      if (item.classList.contains("locked")) {
        return;
      }

      const name = item.getAttribute("data-item");
      const equipped = item.classList.toggle("is-equipped");

      if (equipped) {
        stage.classList.add("wears-" + name);
        return;
      }

      stage.classList.remove("wears-" + name);
    });
  });
}
