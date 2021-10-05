'use strict'; /* 开启严格模式 */

/* 网上找来的轮子，获取 search 参数 */
const $_GET = (() => {
    let re = {};
    if (location.search) {
        let a = location.search.replace("?", "").split("&");
        for (let i in a) {
            let b = a[i].split("=");
            re[b[0]] = decodeURIComponent(b[1]);
        }
    }
    return re;
})();

/* 已选择的文件列表 */
let selected = [];

/* 当前打开的路径 */
let path = document.getElementById("path").dataset.path;
if (path.startsWith("/") || path.startsWith(".")) path = path.substring(1);

/* URI 编码后的路径 */
let encodePath = uri(path);

/* 代码编辑框 */
let code = document.getElementById("code");

/* 以十六进制模式编辑 */
let hex = $_GET["hex"] == "true";

let hexBtn = document.getElementById("hex");
if (hexBtn) {
    hexBtn.innerText = (hex ? "关闭" : "开启") + "十六进制编辑";
}

/* 当前正在编辑的文件名，可能为 undefined */
let file;
if (code) {
    file = code.dataset.file;
}

/* 是否开启 CodeMirrir 编辑器 */
let showeditor = true;
showeditor = localStorage.getItem("editor") == "true";

/* 设置打开/关闭编辑器按钮内容 */
document.getElementById("showeditor").innerText = (showeditor ? "关闭" : "打开") + "编辑器";

/* 编辑器对象变量 */
let editor = null;
if (showeditor && code) {
    editor = CodeMirror.fromTextArea(code, { lineNumbers: true });
}

/* 所有的文件元素 */
let files = document.getElementsByTagName("file");
SetClickSelect(files);

/* 所有的目录元素 */
let dires = document.getElementsByTagName("dire");
SetClickSelect(dires);

/* 是否已按下 Ctrl 键 */
let ctrl = false;

/* 是否已按下 Shift 键 */
let shift = false;

/**
 * EncodeURIComponent 太长了，简化一下
 * @param {string} str 
 * @returns URI 编码后的内容
 */
function uri(str) {
    return encodeURIComponent(str);
}

/**
 * 全选或反选所有
 * @param {boolean} anti
 */
function selectAll(anti) {
    for (let i in files) {
        select(files[i], anti ? undefined : true);
    }
    for (let i in dires) {
        select(dires[i], anti ? undefined : true);
    }
}

let menu = document.getElementsByClassName("menu-group");
for (let i in menu) {
    if (typeof menu[i] != "object") continue;
    let btn = menu[i].getElementsByClassName("menu-btn");
    for (let o in btn) {
        if (typeof btn[o] != "object") continue;
        btn[o].addEventListener("click", () => {
            if (menu[i].classList.contains("show")) {
                menu[i].classList.remove("show");
                return;
            }
            menu[i].classList.add("show");
        });
    }
}

/**
 * 内部方法，获取文件/文件夹元素名称
 * @param {element} element
 */
function getName(element) {
    if (typeof element != "object") return null;
    let nameTag = element.getElementsByTagName("name");
    if (nameTag.length < 1) {
        return element.innerText;
    }
    let name = "";
    for (let i in nameTag) {
        if (typeof nameTag[i] != "object") continue;
        name += nameTag[i].innerText;
    }
    return name;
}

/**
 * 注册事件，当 element 为 undefined 或 null 则不作为
 * @param {element} element
 * @param {string} event
 * @param {function} function
 */
function addEvent(element, event, func) {
    let el = typeof element == "string" ? document.getElementById(element) : element;
    if (el) el.addEventListener(event, func);
}

let types = [
    "text",
    "image",
    "video",
    "audio"
];
for (let i in types) {
    if (typeof types[i] != "string") continue;
    let type = document.getElementById(types[i]);
    if (!type) continue;
    type.addEventListener("click", () => {
        window.location.search = `?operation=edit&dir=${$_GET["dir"]}&file=${$_GET["file"]}&type=${types[i]}`;
    });
}

/* 在按下或弹起某键时更新 Ctrl 键状态 */
addEvent(document, "keydown", event => {
    ctrl = event.ctrlKey;
    shift = event.shiftKey;
    if ($_GET["operation"] != "edit") {
        if (event.code == "KeyA" && ctrl) {
            event.preventDefault();
            selectAll(event.shiftKey);
        }
        if (event.code == "Delete") {
            event.preventDefault();
            document.getElementById("delete").click();
        }
        if (event.code == "KeyM" && ctrl) {
            event.preventDefault();
            document.getElementById("rname").click();
        }
    }
    if (event.code == "KeyO" && ctrl) {
        event.preventDefault();
        document.getElementById("view").click();
    }
    if (event.code == "KeyS" && ctrl) {
        event.preventDefault();
        document.getElementById("save").click();
    }
});

addEvent(document, "keyup", event => {
    ctrl = event.ctrlKey;
    shift = event.shiftKey;
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
                    if (selected.length == 0) {
                        if (elements[i].tagName == "FILE") {
                            let filesearch = `?operation=edit&dir=${encodePath}&file=${uri(getName(elements[i]))}`;
                            if (shift) {
                                /* 在新窗口中打开该文件的编辑 */
                                window.open(filesearch);
                            } else {
                                /* 在当前窗口打开 */
                                window.location.search = filesearch;
                            }
                        } else {
                            /* 跳转到该目录 */
                            window.location.search = `?dir=${encodePath + getName(elements[i])}`;
                        }
                    } else {
                        select(elements[i]);
                    }
                }
            });
            /* 鼠标中键在新窗口打开 */
            elements[i].addEventListener("mousedown", event => {
                if (event.button == 1) {
                    event.preventDefault();
                    window.open(`?operation=edit&dir=${encodePath}&file=${uri(getName(elements[i]))}`);
                }
            })
            /* 菜单事件 */
            elements[i].addEventListener("contextmenu", event => {
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
function select(element, se) {
    if (!element || !element.classList) return;
    if (element.classList.contains("selected") && !se) {
        element.classList.remove("selected");
    } else {
        element.classList.add("selected");
    }
    /* 重新载入所有已选中的对象 */
    reloadSelected();
}

/**
 * 重新载入所有已选中的对象
 */
function reloadSelected() {
    let selectedElement = document.getElementsByClassName("selected");
    selected = [];
    for (let i = 0; i < selectedElement.length; i++) {
        selected[i] = getName(selectedElement[i]);
    }
}

/* 登录按钮点击事件 */
addEvent("login", "click", () => {
    fetch("?operation=login", {
        body: "password=" + document.getElementById("password").value,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        try {
            return response.json();
        } catch (e) {
            notice("操作失败了喵，因为 " + e.toString());
        }
    }).then(data => {
        if (data["code"] == 200) {
            window.location.reload();
        } else {
            /* 错误处理 */
            notice(data["msg"]);
        }
    }).catch(e => {
        notice("请求失败了喵.. 因为 " + e.toString());
    });
});

/* 路径点击事件 */
let paths = document.getElementsByTagName("path");
for (let i in paths) {
    if (paths[i].addEventListener) {
        /* 路径项点击跳转到该路径 */
        paths[i].addEventListener("click", () => {
            /* 使用 PHP 中输出的 "p" 属性 */
            let p = paths[i].hasAttribute("p") ? paths[i].getAttribute("p") : "/";
            window.location.search = `?dir=${uri(p)}`;
        });
    }
}

/* 保存按钮点击事件 */
addEvent("save", "click", () => {
    document.getElementById("save").innerText = "保存中...";

    /* 当前编辑的文件名 */
    fetch(`?operation=savefile&dir=${encodePath}&file=${file}&hex=${$_GET["hex"]}`, {
        method: "POST",
        body: "data=" + uri((editor ? editor.getValue() : document.getElementById("code").value).trim()),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        try {
            return response.json();
        } catch (e) {
            notice("操作失败了喵，因为 " + e.toString());
        }
    }).then(data => {
        if (data["code"] == 200) {
            notice("文件保存成功辣！", "rgb(0 144 255)");
            document.getElementById("save").innerText = "保存";
        } else if (data["code"] == 403) {
            notice("该文件受到保护了喵...");
        }
    }).catch(e => {
        notice("请求失败了喵.. 因为 " + e.toString());
    });
});

/* 刷新按钮点击事件 */
addEvent("reload", "click", () => {
    /* 刷新本窗口 */
    window.location.reload();
});

/* 下载按钮点击事件 */
addEvent("download", "click", () => {
    window.location.href = `?operation=download&dir=${encodePath}&file=${file}`;
});

/**
 * 弹出底部警告
 * @param {string} msg 警告内容
 * @param {string} color 警告背景颜色
 */
function notice(msg, color) {
    let notice = document.createElement("DIV");
    notice.classList.add("notice");
    if (color) notice.style.background = color;
    let noticeText = document.createElement("SPAN");
    noticeText.classList.add("notice-text");
    noticeText.innerText = msg;
    notice.appendChild(noticeText);
    document.body.appendChild(notice);
    setTimeout(() => {
        notice.classList.add("show");
    }, 1);
    setTimeout(() => {
        notice.classList.remove("show");
        setTimeout(() => {
            notice.remove();
        }, 200);
    }, 2500);
}

/* 打包文件点击事件 */
addEvent("zip", "click", () => {
    if (selected.length > 0) {
        window.open(`?operation=zipfiles&dir=${encodePath}&files=${JSON.stringify(selected)}`);
    } else {
        notice("好像还没有选中文件呢喵？");
    }
});

/* 删除文件点击事件 */
addEvent("delete", "click", () => {
    if (selected.length > 0) {
        if (confirm(`真的要删除这 ${selected.length} 个文件/文件夹吗喵？？`)) {
            fetch(`?operation=unlink&dir=${encodePath}`, {
                method: "POST",
                body: `files=${JSON.stringify(selected)}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(response => {
                try {
                    return response.json();
                } catch (e) {
                    notice("操作失败了喵，因为 " + e.toString());
                }
            }).then(data => {
                if (data["code"] == 200) {
                    notice("删除成功了喵！", "rgb(0 144 255)");
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            }).catch(e => {
                notice("请求失败了喵.. 因为 " + e.toString());
            });
        } else {
            notice("不删就不要乱点嘛喵~");
        }
    } else {
        notice("你还没选择要删除哪些文件呢喵！");
    }
});

/* 解压按钮点击事件 */
addEvent("unzip", "click", () => {
    if (selected.length > 0) {
        let password = prompt("如果有密码的话要告诉我喵~ 没有的话留空就够了~");
        let unzippath = prompt("另外告诉我要解压到哪个路径吧？", path);
        fetch(`?operation=unzip&dir=${encodePath}`, {
            method: "POST",
            body: `files=${JSON.stringify(selected)}&password=${uri(password ? password : "")}&path=${uri(unzippath)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            try {
                return response.json();
            } catch (e) {
                notice("操作失败了喵，因为 " + e.toString());
            }
        }).then(data => {
            if (data["code"] == 200) {
                notice("解压成功了喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (data["code"] == 500) {
                notice(`解压失败，因为${data["msg"]}..`);
            }
        }).catch(e => {
            notice("请求失败了喵.. 因为 " + e.toString());
        });
    } else {
        notice("你还没选择要解压哪些文件呢喵！");
    }
});

/* 重命名按钮点击事件 */
addEvent("rname", "click", () => {
    if (selected.length < 1) {
        notice("你还没选择要重命名哪个文件呢喵！");
        return;
    }
    if (selected.length > 1) {
        notice("一次只能重命名一个文件嗷！");
        return;
    }
    let newName = prompt("请输入新名称喵：", selected[0]);
    if (newName) {
        fetch(`?operation=rename&dir=${encodePath}&file=${uri(selected[0])}`, {
            method: "POST",
            body: `new-name=${uri(newName)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            try {
                return response.json();
            } catch (e) {
                notice("操作失败了喵，因为 " + e.toString());
            }
        }).then(data => {
            if (data["code"] == 200) {
                notice("重命名成功了喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (data["code"] == 403) {
                notice("该文件或该名称的文件受到保护，不能修改喵~");
            } else if (data["code"] == 404) {
                notice("咦？这个文件怎么不见了？");
            }
        }).catch(e => {
            notice("请求失败了喵.. 因为 " + e.toString());
        });
    }
});

/* 新建文件按钮点击事件 */
addEvent("newfile", "click", () => {
    let filename = prompt("不妨告诉我一下新文件的名称？");
    if (filename) {
        fetch(`?operation=newfile&dir=${encodePath}`, {
            method: "POST",
            body: `name=${uri(filename)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            try {
                return response.json();
            } catch (e) {
                notice("操作失败了喵，因为 " + e.toString());
            }
        }).then(data => {
            if (data["code"] == 200) {
                notice("新建文件成功喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (data["code"] == 403) {
                notice("该文件已存在了嗷！");
            }
        }).catch(e => {
            notice("请求失败了喵.. 因为 " + e.toString());
        });
    } else {
        notice("既然不告诉我，那我就不新建了 QAQ");
    }
});

/* 新建文件夹按钮点击事件 */
addEvent("mkdir", "click", () => {
    let dirname = prompt("不妨告诉我一下新文件夹的名称？");
    if (dirname) {
        fetch(`?operation=mkdir&dir=${encodePath}`, {
            method: "POST",
            body: `name=${uri(dirname)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            try {
                return response.json();
            } catch (e) {
                notice("操作失败了喵，因为 " + e.toString());
            }
        }).then(data => {
            if (data["code"] == 200) {
                notice("新建文件夹成功喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (data["code"] == 403) {
                notice("该目录已存在了嗷！");
            }
        }).catch(e => {
            notice("请求失败了喵.. 因为 " + e.toString());
        });
    } else {
        notice("既然不告诉我，那我就不新建了 QAQ");
    }
});

/* 上传文件按钮点击事件 */
addEvent("upload", "click", () => {
    document.getElementById("upload-file").click();
});

/* 选择文件被改变事件 */
addEvent("upload-file", "change", () => {
    let uploadFiles = document.getElementById("upload-file").files;
    if (uploadFiles.length > 0) {
        let form = new FormData();
        for (let i = 0; i < uploadFiles.length; i++) {
            form.append(`files${i}`, uploadFiles[i]);
        }
        notice("正在开始上传文件啦，要耐心等待喔！", "rgb(0 144 255)");
        let xhr = new XMLHttpRequest();
        xhr.open("POST", `?operation=upload&dir=${encodePath}`);
        xhr.addEventListener("load", () => {
            let data = null;
            try {
                data = JSON.parse(xhr.responseText);
            } catch (e) {
                notice("操作失败了喵，因为 " + e.toString());
            }
            if (!data) return;
            if (data["code"] == 200) {
                notice("文件上传成功惹！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                notice("上传失败了喵，重新试试吧？");
            }
        });
        xhr.addEventListener("error", e => {
            notice("上传失败了喵.. 因为 " + e.toString());
        });
        try {
            xhr.send(form);
        } catch (e) {
            notice(`上传失败惹，我也不知道为什么：${e}`)
        }
    }
});

/* 开启/关闭编辑器按钮点击事件 */
addEvent("showeditor", "click", () => {
    localStorage.setItem("editor", !showeditor) /* 取反 */
    notice("修改成功了喵~", "rgb(0 144 255)");
    setTimeout(() => {
        window.location.reload();
    }, 1500);
});

/* 检查更新按钮点击事件 */
addEvent("check-update", "click", () => {
    fetch(`?operation=checkupdata`).then(response => {
        try {
            return response.json();
        } catch (e) {
            notice("操作失败了喵，因为 " + e.toString());
        }
    }).then(data => {
        if (data["now-version"] != data["last-version"]) {
            let updataLog = "";
            for (let i in data["updata-log"]) {
                updataLog += `${i}. ${data["updata-log"][i]}\n`;
            }
            if (window.confirm(`发现新版本！\n新版版本号：${data["last-version"]}\n当前版本号：${data["now-version"]}\n本次更新内容：\n${updataLog}是否下载新版源代码？`)) {
                window.open(data["updata-link"]);
            }
        } else {
            notice("已是最新版本啦~", "rgb(0 144 255)");
        }
    }).catch(e => {
        notice("请求失败了喵.. 因为 " + e.toString());
    });
});

/* 访问按钮点击事件 */
addEvent("view", "click", () => {
    window.open(path + file);
});

/* 全选按钮点击事件 */
addEvent("select-all", "click", () => {
    selectAll(true);
});

addEvent("hex", "click", () => {
    window.location.search = `?operation=edit&dir=${$_GET["dir"]}&file=${$_GET["file"]}&hex=${!hex}`;
});
