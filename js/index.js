let selected = [];
let files = document.getElementsByTagName("file");
let path = document.getElementById("path").dataset.path;
if (path.startsWith("/")) path = path.substring(1);
let ctrl = false;
SetClickSelect(files);
let dires = document.getElementsByTagName("dire");
document.addEventListener("keydown", (event) => {
    ctrl = event.ctrlKey;
});
document.addEventListener("keyup", (event) => {
    ctrl = event.ctrlKey;
});
SetClickSelect(dires);
function SetClickSelect(elements) {
    for (let i in elements) {
        if (elements[i].addEventListener) {
            elements[i].addEventListener("click", () => {
                if (ctrl) {
                    select(elements[i]);
                } else {
                    if (elements[i].tagName == "FILE") {
                        window.open(`?operation=edit&dir=${encodeURIComponent(path)}&file=${encodeURIComponent(elements[i].innerText)}`);
                    } else {
                        window.location.search = `?dir=${encodeURIComponent(path) + elements[i].innerText}`;
                    }
                }
            });
            elements[i].addEventListener("contextmenu", (event) => {
                select(elements[i]);
                event.preventDefault();
            });
        }
    }
}
function select(element) {
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
let paths = document.getElementsByTagName("path");
for (let i in paths) {
    if (paths[i].addEventListener) {
        paths[i].addEventListener("click", () => {
            let p = paths[i].hasAttribute("p") ? paths[i].getAttribute("p") : "/";
            window.location.search = `?dir=${encodeURIComponent(p)}`;
        });
    }
}
function notice(msg) {
    document.getElementById("notice-text").innerText = msg;
    document.getElementById("notice").classList.add("show");
    setTimeout(() => {
        document.getElementById("notice").classList.remove("show");
    }, 3000);
}
