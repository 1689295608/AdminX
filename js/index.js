'use strict'; /* 开启严格模式 */

/* 已选择的文件列表 */
let selected = [];

/* 当前打开的路径 */
let path = document.getElementById("path").dataset.path;
if (path.startsWith("/")) path = path.substring(1);

/* URI 编码后的路径 */
let encodePath = uri(path);

/* 当前正在编辑的文件名，可能为 undefined */
let file = document.getElementById("code").dataset.file;

/* 是否开启 CodeMirrir 编辑器 */
let showeditor = true;
showeditor = localStorage.getItem("editor") == "true";

/* 设置打开/关闭编辑器按钮内容 */
document.getElementById("showeditor").innerText = (showeditor ? "关闭" : "打开") + "编辑器";

/* 编辑器对象变量 */
let editor = null;
if (showeditor) {
    editor = CodeMirror.fromTextArea(document.getElementById("code"), { lineNumbers: true });
}

/* 所有的文件元素 */
let files = document.getElementsByTagName("file");
SetClickSelect(files);

/* 所有的目录元素 */
let dires = document.getElementsByTagName("dire");
SetClickSelect(dires);

/* 是否已按下 Ctrl 键 */
let ctrl = false;

/**
 * EncodeURIComponent 太长了，简化一下
 * @param {string} str 
 * @returns URI 编码后的内容
 */
function uri(str) {
    return encodeURIComponent(str);
}

/* 在按下或弹起某键时更新 Ctrl 键状态 */
document.getElementById("filelist").addEventListener("keydown", (event) => {
    ctrl = event.ctrlKey;
    if (event.code == "KeyA" && ctrl) {
        event.preventDefault();
        for (let i in files) {
            select(files[i], event.shiftKey ? undefined : true);
        }
        for (let o in dires) {
            select(dires[o], event.shiftKey ? undefined : true);
        }
    }
    if (event.code == "Delete") {
        event.preventDefault();
        document.getElementById("delete").click();
    }
    if (event.code == "KeyM" && ctrl) {
        event.preventDefault();
        document.getElementById("rename").click();
    }
});

document.getElementById("filelist").addEventListener("keyup", (event) => {
    ctrl = event.ctrlKey;
});

/* 注册快捷键 */
document.getElementById("editor").addEventListener("keydown", (event) => {
    if (event.code == "KeyS" && ctrl) {
        event.preventDefault();
        document.getElementById("save").click();
    }
})

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
                        window.open(`?operation=edit&dir=${encodePath}&file=${uri(elements[i].innerText)}`);
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
function select(element, se) {
    if (!element || !element.classList) return;
    if (element.classList.contains("selected") && !se) {
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
            window.location.search = `?dir=${uri(p)}`;
        });
    }
}

/* 保存按钮点击事件 */
document.getElementById("save").addEventListener("click", () => {
    document.getElementById("save").innerText = "保存中...";

    /* 当前编辑的文件名 */
    fetch(`?operation=savefile&dir=${encodePath}&file=${file}`, {
        method: "POST",
        body: "data=" + (editor ? editor.getValue() : document.getElementById("code").value).trim(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data["code"] == 200) {
            notice("文件保存成功辣！", "rgb(0 144 255)");
            document.getElementById("save").innerText = "保存";
        } else if (data["code"] == 403) {
            notice("该文件受到保护了喵...");
        }
    })
});

/* 刷新按钮点击事件 */
document.getElementById("reload").addEventListener("click", () => {
    /* 刷新本窗口 */
    window.location.reload();
});

/* 下载按钮点击事件 */
document.getElementById("download").addEventListener("click", () => {
    window.location.href = `?operation=download&dir=${encodePath}&file=${file}`;
});

/**
 * 弹出底部警告
 * @param {string} msg 警告内容
 * @param {string} color 警告背景颜色
 */
function notice(msg, color) {
    if (color) document.getElementById("notice").style.background = color;
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
            });
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
        let password = prompt("如果有密码的话要告诉我喵~ 没有的话留空就够了~");
        let path = prompt("另外告诉我要解压到哪个路径吧？", "/");
        fetch(`?operation=unzip&dir=${encodePath}`, {
            method: "POST",
            body: `files=${JSON.stringify(selected)}&password=${uri(password ? password : "")}&path=${uri(path)}`,
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
                }, 2000);
            }
        });
    } else {
        notice("你还没选择要解压哪些文件呢喵！");
    }
});

/* 重命名按钮点击事件 */
document.getElementById("rname").addEventListener("click", () => {
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
            return response.json();
        }).then(data => {
            if (data["code"] == 200) {
                notice("重命名成功了喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (data["code"] == 403) {
                notice("该文件或该名称的文件受到保护，不能修改喵~");
            } else if (data["code"] == 404) {
                notice("咦？这个文件怎么不见了？");
            }
        });
    }
});

/* 新建文件按钮点击事件 */
document.getElementById("newfile").addEventListener("click", () => {
    let filename = prompt("不妨告诉我一下新文件的名称？");
    if (filename) {
        fetch(`?operation=newfile&dir=${encodePath}`, {
            method: "POST",
            body: `name=${uri(filename)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data["code"] == 200) {
                notice("新建文件成功喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (data["code"] == 403) {
                notice("该文件已存在了嗷！");
            }
        });
    } else {
        notice("既然不告诉我，那我就不新建了 QAQ");
    }
});

/* 新建文件夹按钮点击事件 */
document.getElementById("mkdir").addEventListener("click", () => {
    let dirname = prompt("不妨告诉我一下新文件夹的名称？");
    if (dirname) {
        fetch(`?operation=mkdir&dir=${encodePath}`, {
            method: "POST",
            body: `name=${uri(dirname)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data["code"] == 200) {
                notice("新建文件夹成功喵！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (data["code"] == 403) {
                notice("该目录已存在了嗷！");
            }
        });
    } else {
        notice("既然不告诉我，那我就不新建了 QAQ");
    }
});

/* 上传文件按钮点击事件 */
document.getElementById("upload").addEventListener("click", () => {
    document.getElementById("upload-file").click();
});

/* 选择文件被改变事件 */
document.getElementById("upload-file").addEventListener("change", () => {
    let uploadFiles = document.getElementById("upload-file").files;
    if (uploadFiles.length > 0) {
        let form = new FormData();
        for (let i = 0; i < uploadFiles.length; i ++) {
            form.append(`files${i}`, uploadFiles[i]);
        }
        notice("正在开始上传文件啦，要耐心等待喔！", "rgb(0 144 255)");
        let xhr = new XMLHttpRequest();
        xhr.open("POST", `?operation=upload&dir=${encodePath}`);
        xhr.addEventListener("load", () => {
            let data = JSON.parse(xhr.responseText);
            if (data["code"] == 200) {
                notice("文件上传成功惹！", "rgb(0 144 255)");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                notice("上传失败了喵，重新试试吧？");
            }
        });
        try {
            xhr.send(form);
        } catch (e) {
            notice(`上传失败惹，我也不知道为什么：${e}`)
        }
    }
});

/* 开启/关闭编辑器按钮点击事件 */
document.getElementById("showeditor").addEventListener("click", () => {
    localStorage.setItem("editor", !showeditor) /* 取反 */
    notice("修改成功了喵~", "rgb(0 144 255)");
    setTimeout(() => {
        window.location.reload();
    }, 2000);
});

/* 检查更新按钮点击事件 */
document.getElementById("check-update").addEventListener("click", () => {
    fetch(`?operation=checkupdata`).then(response => {
        return response.json();
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
    })
});
