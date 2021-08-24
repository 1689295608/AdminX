let selected = [];
let files = document.getElementsByTagName("file");
let path = document.getElementById("path").dataset.path;
let ctrl = false;
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
document.addEventListener("keydown", (event) => {
    ctrl = event.ctrlKey;
});
document.addEventListener("keyup", (event) => {
    ctrl = event.ctrlKey;
});
SetClickSelecte(dires);
function SetClickSelecte(elements) {
    for (let i in elements) {
        if (elements[i].addEventListener) {
            elements[i].addEventListener("click", () => {
                if (ctrl) {
                    selecte(elements[i]);
                }
            });
            elements[i].addEventListener("contextmenu", () => {
                selecte(elements[i]);
            });
        }
    }
}
function selecte(element) {
    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
    } else {
        element.classList.add("selected");
    }
    ReloadSelected();
}
function ReloadSelected() {
    let selectedElement = document.getElementsByClassName("selected");
    selected = [];
    for (let i = 0; i < selectedElement.length; i++) {
        selected[i] = selectedElement[i].innerText;
    }
}
document.getElementById("login").addEventListener("click", () => {
    fetch("?operation=login", {
        body: "password=" + document.getElementById("password").value,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        if (data["code"] == 200) {
            window.location.reload();
        } else {
            notice(data["msg"]);
        }
    })
});

function notice(msg) {
    document.getElementById("notice-text").innerText = msg;
    document.getElementById("notice").classList.add("show");
    setTimeout(() => {
        document.getElementById("notice").classList.remove("show");
    }, 1000);
}
