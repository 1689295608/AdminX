'use strict'; /* 开启严格模式 */

/* 已选择的文件列表 */
let selected = [];

/* 当前打开的路径 */
let path = document.getElementById("path").dataset.path;
if (path.startsWith("/")) path = path.substring(1);

/* URI 编码后的路径 */
let encodePath = encodeURIComponent(path);

/* 所有的文件元素 */
let files = document.getElementsByTagName("file");
SetClickSelect(files);

/* 所有的目录元素 */
let dires = document.getElementsByTagName("dire");
SetClickSelect(dires);

/* 是否已按下 Ctrl 键 */
let ctrl = false;

/* 在按下或弹起某键时更新 Ctrl 键状态 */
document.addEventListener("keydown", (event) => {
    ctrl = event.ctrlKey;
    if (event.code == "KeyA") {
        event.preventDefault();
        for (let i in files) {
            select(files[i], event.shiftKey ? undefined : true);
        }
        for (let o in dires) {
            select(dires[o], event.shiftKey ? undefined : true);
        }
    }
});
document.addEventListener("keyup", (event) => {
    ctrl = event.ctrlKey;
});

/**
 * 注册文件、目录的单击和菜单事件
 * @param {Element} elements 对象
 */
function SetClickSelect(elements) {
    for (let i in elements) {
        if (elements[i].addEventListener) {
            /* 单击事件 */
            elements[i].addEventListener("click", () => {
                if (ctrl) {
                    /* 开关该对象的选中模式 */
                    select(elements[i]);
                } else {
                    if (elements[i].tagName == "FILE") {
                        /* 在新窗口中打开该文件的编辑 */
                        window.open(`?operation=edit&dir=${encodePath}&file=${encodeURIComponent(elements[i].innerText)}`);
                    } else {
                        /* 跳转到该目录 */
                        window.location.search = `?dir=${encodePath + elements[i].innerText}`;
                    }
                }
            });
            /* 菜单事件 */
            elements[i].addEventListener("contextmenu", (event) => {
                /* 开关该对象的选中模式 */
                select(elements[i]);
                event.preventDefault();
            });
        }
    }
}

/**
 * 切换该对象的选中模式
 * @param {Element} element 对象
 */
function select(element, select) {
    if (element == undefined) return;
    if (element.classList.contains("selected") || !select) {
        element.classList.remove("selected");
    } else {
        element.classList.add("selected");
    }
    /* 重新载入所有已选中的对象 */
    ReloadSelected();
}

/**
 * 重新载入所有已选中的对象
 */
function ReloadSelected() {
    let selectedElement = document.getElementsByClassName("selected");
    selected = [];
    for (let i = 0; i < selectedElement.length; i++) {
        selected[i] = selectedElement[i].innerText;
    }
}

/* 登录按钮点击事件 */
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
            /* 错误处理 */
            notice(data["msg"]);
        }
    })
});

/* 路径点击事件 */
let paths = document.getElementsByTagName("path");
for (let i in paths) {
    if (paths[i].addEventListener) {
        /* 路径项点击跳转到该路径 */
        paths[i].addEventListener("click", () => {
            /* 使用 PHP 中输出的 "p" 属性 */
            let p = paths[i].hasAttribute("p") ? paths[i].getAttribute("p") : "/";
            window.location.search = `?dir=${encodeURIComponent(p)}`;
        });
    }
}

/* 保存按钮点击事件 */
document.getElementById("save").addEventListener("click", () => {
    document.getElementById("save").innerText = "保存中...";

    /* 当前编辑的文件名 */
    let file = document.getElementById("code").dataset.file;
    fetch(`?operation=savefile&dir=${encodePath}&file=${file}`, {
        method: "POST",
        body: "data=" + document.getElementById("code").innerText.trim(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data["code"] == 200) {
            document.getElementById("save").innerText = "成功";
            setTimeout(() => {
                document.getElementById("save").innerText = "保存";
            }, 3000);
        }
    })
});

/* 刷新按钮点击事件 */
document.getElementById("reload").addEventListener("click", () => {
    /* 刷新本窗口 */
    window.location.reload();
});

/**
 * 弹出底部警告
 * @param {string} msg 警告内容
 * @param {string} color 警告背景颜色
 */
function notice(msg, color) {
    if (color != undefined) document.getElementById("notice").style.background = color;
    document.getElementById("notice-text").innerText = msg;
    document.getElementById("notice").classList.add("show");
    setTimeout(() => {
        document.getElementById("notice").classList.remove("show");
    }, 3000);
}

/* 打包文件点击事件 */
document.getElementById("zip").addEventListener("click", () => {
    if (selected.length > 0) {
        window.open(`?operation=zipfiles&dir=${encodePath}&files=${JSON.stringify(selected)}`);
    } else {
        notice("好像还没有选中文件呢喵？");
    }
});

/* 删除文件点击事件 */
document.getElementById("delete").addEventListener("click", () => {
    if (selected.length > 0) {
        if (confirm(`真的要删除这 ${selected.length} 个文件吗喵？？`)) {
            fetch(`?operation=unlink&dir=${encodePath}`, {
                method: "POST",
                body: `files=${JSON.stringify(selected)}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(response => {
                return response.json();
            }).then(data => {
                if (data["code"] == 200) {
                    notice("删除成功了喵！", "rgb(0 144 255)");
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            })
        } else {
            notice("不删就不要乱点嘛喵~");
        }
    } else {
        notice("你还没选择要删除哪些文件呢喵！");
    }
});

/* 解压按钮点击事件 */
document.getElementById("unzip").addEventListener("click", () => {
    if (selected.length > 0) {
        fetch(`?operation=unzip&dir=${encodePath}`, {
            method: "POST",
            body: `files=${JSON.stringify(selected)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data["code"] == 200) {
                notice("解压成功了喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }
        })
    } else {
        notice("你还没选择要删除哪些文件呢喵！");
    }
})
