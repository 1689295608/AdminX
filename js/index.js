let selected = [];
let files = document.getElementsByTagName("file");
let path = document.getElementById("path").dataset.path;
SetClickSelecte(files);
for (let i in files) {
    if (files[i].addEventListener) {
        files[i].addEventListener("dbclick", () => {
            window.open(`?operstion=edit&dir=${encodeURIComponent(path)}$file=${encodeURIComponent(files[i].innerText)}`);
        });
    }
}
let dires = document.getElementsByTagName("dire");
for (let i in dires) {
    if (dires[i].addEventListener) {
        dires[i].addEventListener("dbclick", () => {
            window.location.search = `?dir=${encodeURIComponent(path)}`;
        });
    }
}
SetClickSelecte(dires);
function SetClickSelecte(elements) {
    for (let i in elements) {
        if (elements[i].addEventListener) {
            elements[i].addEventListener("click", () => {
                if (elements[i].classList.contains("selected")) {
                    elements[i].classList.remove("selected");
                } else {
                    elements[i].classList.add("selected");
                }
                ReloadSelected();
            });
        }
    }
}
function ReloadSelected() {
    let selectedElement = document.getElementsByClassName("selected");
    selected = [];
    for (let i = 0; i < selectedElement.length; i ++) {
        selected[i] = selectedElement[i].innerText;
    }
}
