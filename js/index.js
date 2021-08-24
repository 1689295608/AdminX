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
    document.getElementById("notice-text").classList.add("show");
    setTimeout(() => {
        document.getElementById("notice-text").classList.remove("show");
    }, 200);
}
