<?php
/* ----------=== 配置部分 ===---------- */
/* 填入你的密码，使用这个密码就可以操作您的主机中的所有文件 */
$password = "AdminX";

/* 编辑文件备份目录，为空则不备份 */
$backupdir = "./adminx/backup";

/* 备份的 .bak 文件的文件名是否添加时间戳 */
$backuptime = true;

/* 受保护的文件列表，它们无法使用 AdminX 修改 (使用正则表达式) */
$savedfiles = [
    "/.\/adminx.php/i"
];

/* 输入你的 PHP 版本，不兼容 PHP 5- */
$phpver = 7.4;

/* 输入你的域名是否是 HTTPS 协议，如果不是 HTTPS 请写 false 否则将无法登录 */
$https = true;

/* 是否使用 opendir 列出文件列表 */
$useopendir = true;

/* 配置部分结束，除非你知道你在干什么，否则不要乱改下面的代码 */
?>

<?php
/* 设置缓存为不缓存 */
header("Cache-control: no-store");

/* 是否已验证变量，用于判断密码是否正确 */
$verified = false;

/* 当前版本变量，请勿修改 */
$version = "1.3";

/* 是否使用 opendir 方法打开目录的全局变量 */
$GLOBALS["useopendir"] = $useopendir;

/* 保护的文件的全局变量 */
$GLOBALS["savedfiles"] = $savedfiles;

/* 判断密码是否匹配 */
if (isset($_COOKIE["password"])) {
    $verified = password_verify($password, $_COOKIE["password"]);
}

/* 对于 PHP 8+ 的 Cookie Option 变量 */
$cookieoptions = [
    'expires' => time() + 60 * 60 * 24 * 7,
    'path' => "/",
    'domain' => $_SERVER["HTTP_HOST"],
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'None'
];

/* 为 PHP 8- 实现一些函数 */
if (!function_exists('str_ends_with')) {
    function str_ends_with($haystack, $needle)
    {
        return substr_compare($haystack, $needle, -strlen($needle)) === 0;
    }
}
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle)
    {
        return substr_compare($haystack, $needle, 0, strlen($needle)) === 0;
    }
}

/* 实现列出文件列表方法 */
function dirlist($dir)
{
    if ($GLOBALS["useopendir"]) {
        $out = [];
        if ($dh = opendir($dir)) {
            while (($file = readdir($dh)) !== false) {
                array_push($out, $file);
            }
        }
        return $out;
    }
    return scandir($dir);
}

/* 当前所在目录变量 */
$dir = "/";

/* 当前所在目录名变量 */
$dirname = "根目录";

if (isset($_GET["dir"]))
    $dir = $_GET["dir"];

if (!str_starts_with($dir, "."))
    $dir = ".$dir";

$dirs = explode("/", $dir);

if (count($dirs) > 0 && end($dirs) != "")
    $dirname = end($dirs);

/* ZipArchive 错误信息值 */
$ZIP_ERROR = [
    ZipArchive::ER_EXISTS => '文件已存在',
    ZipArchive::ER_INCONS => 'Zip 文件不一致',
    ZipArchive::ER_INVAL => '参数无效',
    ZipArchive::ER_MEMORY => '内存分配失败',
    ZipArchive::ER_NOENT => '文件不存在',
    ZipArchive::ER_NOZIP => '不是 Zip 文件',
    ZipArchive::ER_OPEN => "无法打开文件",
    ZipArchive::ER_READ => '读取失败',
    ZipArchive::ER_SEEK => '查找失败',
];

/* 判断文件是否是受保护的 */
function is_saved($file)
{
    if (!isset($GLOBALS["savedfiles"])) return false;
    for ($i = 0; $i < count($GLOBALS["savedfiles"]); $i++) {
        if (preg_match($GLOBALS["savedfiles"][$i], $file)) {
            return true;
        }
    }
    return false;
}

/* 向 Zip 添加目录 */
function adddir($zip, $opendir)
{
    $dirlist = dirlist($opendir);
    foreach ($dirlist as $key => $file) {
        if ($file == "." || $file == "..") continue;
        if (is_dir("$opendir/$file")) {
            $zip->addEmptyDir("$opendir/$file");
            adddir($zip, "$opendir/$file");
        }
        if (is_file("$opendir/$file")) {
            $zip->addFile("$opendir/$file");
        }
    }
}

/* 遍历删除文件夹 */
function delete_dir($dirname)
{
    if (is_dir($dirname)) {
        $filelist = dirlist($dirname);
        foreach ($filelist as $key => $file) {
            if ($file == "." || $file == "..") continue;
            if (is_dir("$dirname/$file")) {
                delete_dir("$dirname/$file");
            } else {
                if (!is_saved("$dirname/$file")) {
                    unlink("$dirname/$file");
                }
            }
        }
        rmdir($dirname);
    } else {
        unlink($dirname);
    }
}

/* 通过 "/" 分割创建多层目录 */
function mkdirs($pathname)
{
    $paths = explode("/", $pathname);
    $nowp = "";
    foreach ($paths as $key => $value) {
        if ($value == "." || $value == ".." || $value == "") continue;
        $nowp .= $value . "/";
        @mkdir($nowp);
    }
}

if (isset($_GET["operation"])) {
    $operation = $_GET["operation"];
    if ($operation == "login") { /* 登录 */
        if (isset($_POST["password"])) {
            if ($_POST["password"] == $password) {
                $pwdhash = password_hash($password, PASSWORD_BCRYPT);
                if ($phpver >= 8) {
                    setcookie("password", $pwdhash, $cookieoptions);
                } else {
                    setcookie("password", $pwdhash, 0, "/", $SERVER["HTTP_HOST"], $https, true);
                }
                echo json_encode(["code" => 200]);
                return;
            }
            echo json_encode(["code" => 403, "msg" => "密码错误"]);
            return;
        }
        echo json_encode(["code" => 400, "msg" => "缺少参数"]);
        return;
    }
    if ($verified) {
        if ($operation == "zipfiles") { /* 打包文件 */
            $files = null;
            if (isset($_GET["files"])) {
                $files = json_decode($_GET["files"], true);
            }
            if ($files != null) {
                $zip = new ZipArchive();
                $result_code = $zip->open("./adminx.zip", ZipArchive::CREATE | ZipArchive::OVERWRITE);
                if ($result_code === true) {
                    foreach ($files as $key => $filename) {
                        if (is_dir("$dir/$filename")) {
                            adddir($zip, "$dir/$filename");
                        }
                        if (is_file("$dir/$filename")) {
                            $zip->addFile("$dir/$filename");
                        }
                    }
                    $zip->close();
                }
                if (file_exists("./adminx.zip")) {
                    header("Content-Type: application/zip");
                    header("Content-Transfer-Encoding: binary");
                    header("Content-disposition: attachment; filename=" . $dirname . "-ziped.zip");
                    echo file_get_contents("./adminx.zip");
                    unlink("./adminx.zip");
                    return;
                } else {
                    $msg = isset($ZIP_ERROR[$result_code]) ? $ZIP_ERROR[$result_code] : "未知错误";
                    $notice = "打包文件失败！因为$msg";
                }
            } else {
                $notice = "未指明打包的文件！";
            }
        }
        if ($operation == "download") { /* 下载文件 */
            if (isset($_GET["file"])) {
                $file = $_GET["file"];
                header("Content-Type: application/octet-stream");
                header("Content-Transfer-Encoding: binary");
                header("Content-disposition: attachment; filename=$file");
                echo file_get_contents("$dir/$file");
                return;
            } else {
                $notice = "文件名不能为空！";
            }
        }
        if ($operation == "rename") { /* 重命名文件 */
            if (isset($_GET["file"], $_POST["new-name"])) {
                $file = $dir . $_GET["file"];
                $name = $_POST["new-name"];
                if (!(is_saved($file) || is_saved("$dir/$name"))) {
                    if (file_exists($file) || is_dir($file)) {
                        rename($file, $name);
                        echo json_encode(["code" => 200]);
                    } else {
                        echo json_encode(["code" => 404]);
                    }
                } else {
                    echo json_encode(["code" => 403]);
                }
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "unlink") { /* 删除文件 */
            if (isset($_POST["files"])) {
                $files = json_decode($_POST["files"], true);
                foreach ($files as $key => $value) {
                    $file = "$dir/$value";
                    if (!is_saved($file)) {
                        if (is_dir($file)) {
                            delete_dir($file);
                        } else {
                            @unlink($file);
                        }
                    }
                }
                echo json_encode(["code" => 200]);
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "savefile") { /* 写入文件 */
            if (isset($_GET["file"], $_POST["data"])) {
                $fname = $_GET["file"];
                $file = $dir . $_GET["file"];
                if (isset($backupdir) && $backupdir != "") {
                    if (!is_dir($backupdir)) {
                        mkdirs($backupdir);
                    }
                    @file_put_contents("$backupdir/$fname" . ($backuptime ? "." . time() : "") . ".bak", @file_get_contents($file));
                }
                if (!is_saved($file)) {
                    file_put_contents($file, $_POST["data"]);
                    echo json_encode(["code" => 200]);
                } else {
                    echo json_encode(["code" => 403]);
                }
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "edit") { /* 编辑文件 */
            if (isset($_GET["file"])) {
                $file = "$dir/" . $_GET["file"];
                if (file_exists($file)) {
                    $data = file_get_contents($file);
                } else {
                    $notice = "该文件不存在！";
                }
            }
        }
        if ($operation == "mkdir") { /* 创建目录 */
            if (isset($_POST["name"])) {
                $d = "$dir/" . $_POST["name"];
                if (!is_dir($d)) {
                    mkdirs($d);
                    echo json_encode(["code" => 200]);
                } else {
                    echo json_encode(["code" => 403]);
                }
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "newfile") { /* 创建文件 */
            if (isset($_POST["name"])) {
                $d = "$dir/" . $_POST["name"];
                if (!file_exists($d) || !is_saved($d)) {
                    file_put_contents($d, "");
                    echo json_encode(["code" => 200]);
                } else {
                    echo json_encode(["code" => 403]);
                }
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "upload") { /* 上传文件 */
            if (isset($_FILES) && count($_FILES) > 0) {
                foreach ($_FILES as $key => $file) {
                    $p = "$dir/" . $file["name"];
                    if (!is_saved($p)) {
                        move_uploaded_file($file["tmp_name"], $p);
                    }
                }
                echo json_encode(["code" => 200]);
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "unzip") { /* 解压文件 */
            if (isset($_POST["files"])) {
                $files = json_decode($_POST["files"], true);
                foreach ($files as $key => $file) {
                    $zip = new ZipArchive();
                    $result_code = $phpver < 7.4 ? $zip->open($file) : $zip->open($file, ZipArchive::RDONLY);
                    if ($result_code === true) {
                        if (isset($_POST["password"]) && $_POST["password"] != "") {
                            $zip->setPassword($_GET["password"]);
                        }
                        $path = "/";
                        if (isset($_POST["path"]) && $_POST["path"] != "") {
                            $path = $_POST["path"];
                        }
                        $p = "$dir/$path";
                        if (!is_dir($p)) {
                            mkdirs($p);
                        }
                        $zip->extractTo($p);
                        $zip->close();
                    } else {
                        $msg = isset($ZIP_ERROR[$result_code]) ? $ZIP_ERROR[$result_code] : "未知错误";
                        echo json_encode(["code" => 500, "msg" => $msg]);
                        return;
                    }
                }
                echo json_encode(["code" => 200]);
            } else {
                echo json_encode(["code" => 400]);
            }
            return;
        }
        if ($operation == "checkupdata") { /* 检查更新 */
            $last = json_decode(file_get_contents("http://adminx.xurl.ltd/updata.json"), true);
            $last["now-version"] = $version;
            echo json_encode($last);
            return;
        }
    }
}
?>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5">
    <title id="title">AdminX <?php echo substr($dir, 1);
                                if ($operation == "edit") echo $_GET["file"]; ?></title>
    <link href="https://adminx.xurl.ltd/css/index.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/lib/codemirror.css" rel="stylesheet">
    <link rel="shortcut icon" href="data:image/svg+xml,%3Csvg t='1629778780616' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='6362' width='200' height='200'%3E%3Cpath d='M678.4 642.4c24-12.8 52-20.8 81.6-20.8 3.2 0 4.8-3.2 2.4-5.6-30.4-27.2-65.6-49.6-104-65.6-0.8 0-0.8 0-1.6-0.8 62.4-44.8 102.4-118.4 102.4-200.8 0-136.8-110.4-248-247.2-248s-247.2 111.2-247.2 248c0 82.4 40 156 102.4 200.8 0 0-0.8 0-1.6 0.8-44.8 19.2-84.8 46.4-119.2 80.8-34.4 34.4-61.6 74.4-80.8 119.2-18.4 44-28 90.4-29.6 138.4 0 4.8 3.2 8 8 8h60c4 0 8-3.2 8-8 1.6-77.6 32.8-149.6 88-204 56.8-56.8 132-88 212-88 56.8 0 111.2 16 158.4 44.8 2.4 1.6 5.6 2.4 8 0.8zM512 520.8c-45.6 0-88.8-17.6-121.6-50.4-32-32.8-50.4-76-50.4-121.6s17.6-88.8 50.4-121.6 75.2-50.4 121.6-50.4 88.8 17.6 121.6 50.4 50.4 76 50.4 121.6-17.6 88.8-50.4 121.6-75.2 50.4-121.6 50.4z m404 336.8l-26.4-22.4c1.6-7.2 1.6-15.2 1.6-23.2s-0.8-15.2-1.6-23.2l26.4-22.4c4-3.2 5.6-8.8 4-14.4v-0.8c-7.2-20-17.6-38.4-32-55.2l-0.8-0.8c-3.2-4-8.8-5.6-13.6-4l-32 11.2c-12-9.6-25.6-17.6-40-23.2l-6.4-33.6c-0.8-5.6-4.8-9.6-10.4-10.4H784c-20.8-4-42.4-4-63.2 0H720c-5.6 0.8-9.6 4.8-10.4 10.4l-6.4 33.6c-14.4 5.6-27.2 12.8-39.2 23.2l-32.8-11.2c-4.8-1.6-10.4 0-13.6 4l-1.6 2.4c-13.6 16-24.8 35.2-32 55.2v0.8c-1.6 4.8 0 10.4 4 14.4l26.4 22.4c-1.6 7.2-1.6 15.2-1.6 22.4 0 8 0.8 15.2 1.6 22.4l-26.4 22.4c-4 3.2-5.6 8.8-4 14.4v0.8c7.2 20 17.6 38.4 32 55.2l0.8 0.8c3.2 4 8.8 5.6 13.6 4l32.8-11.2c12 9.6 24.8 17.6 39.2 23.2l6.4 33.6c0.8 5.6 4.8 9.6 10.4 10.4h0.8c10.4 1.6 20.8 3.2 32 3.2s21.6-0.8 32-3.2h0.8c5.6-0.8 9.6-4.8 10.4-10.4l6.4-33.6c14.4-5.6 28-12.8 40-23.2l32 11.2c4.8 1.6 10.4 0 13.6-4l0.8-0.8c13.6-16 24.8-35.2 32-55.2v-0.8c1.6-4.8 0-10.4-4-14.4z m-81.6-58.4c0.8 4.8 0.8 8.8 0.8 13.6s0 9.6-0.8 13.6l-1.6 12 22.4 19.2c-3.2 8-8 15.2-12.8 22.4l-28-9.6-9.6 8c-7.2 5.6-15.2 10.4-24 13.6l-11.2 4-5.6 28.8c-8.8 0.8-16.8 0.8-25.6 0l-5.6-28.8-11.2-4c-8.8-3.2-16.8-8-24-13.6l-9.6-8-28 9.6c-4.8-7.2-9.6-14.4-12.8-22.4l22.4-19.2-1.6-12c-0.8-4.8-0.8-8.8-0.8-13.6 0-4.8 0-8.8 0.8-13.6l1.6-12L648 768c3.2-8 8-15.2 12.8-22.4l28 9.6 9.6-8c7.2-5.6 15.2-10.4 24-13.6l11.2-4 5.6-28.8c8.8-0.8 16.8-0.8 25.6 0l5.6 28.8 11.2 4c8.8 3.2 16.8 8 24 13.6l9.6 8 28-9.6c4.8 7.2 9.6 14.4 12.8 22.4l-22.4 19.2 0.8 12z' p-id='6363'%3E%3C/path%3E%3C/svg%3E" type="image/x-icon" />
</head>

<body>
    <div class="header">
        <span class="header-title">
            <span class="header-title-admin">Admin</span><span class="header-title-x">X</span>
            <span id="check-update" title="检查更新" class="header-version">Release <?php echo $version ?></span>
        </span>
    </div>
    <div class="adminx-index">
        <div class="admin-login <?php echo $verified ? "hidden" : "" ?>">
            <div class="admin-login-window">
                <span class="admin-login-header">登录 AdminX</span>
                <span class="admin-login-title">请输入密码以管理您的文件</span>
                <input type="password" id="password"><btn id="login">登录</btn>
            </div>
        </div>
        <div class="adminx-path" id="path" data-path="<?php echo $dir; ?>">
            <path>根目录</path>
            <deli></deli>
            <?php
            $jumplink = "";
            for ($i = 0; $i < count($dirs); $i++) {
                if ($dirs[$i] == "" || $dirs[$i] == ".") continue;
                $jumplink .= $dirs[$i] . "/";
                echo "<path p=\"$jumplink\">" . htmlentities($dirs[$i]) . "</path><deli></deli>";
            }
            if ($operation == "edit") {
                echo "<edit>" . htmlentities($_GET["file"]) . "</edit>";
            }
            ?>
        </div>
        <div class="admin-view">
            <div class="mult-control-btn">
                <btn id="select-all">全选</btn>
                <btn id="zip">打包</btn>
                <btn id="delete">删除</btn>
                <btn id="unzip">解压</btn>
                <btn id="rname">重命名</btn>
                <btn id="newfile">新建文件</btn>
                <btn id="mkdir">新建目录</btn>
                <btn id="upload">上传文件</btn>
                <input id="upload-file" type="file" name="files" multiple></input>
            </div>
            <div class="adminx-filelist" id="filelist">
                <?php
                if ($verified) {
                    /* 列出文件列表 */
                    if (@is_dir("$dir")) {
                        $files = dirlist("$dir");
                        for ($i = 0; $i < count($files); $i++) {
                            if ($files[$i] == "." || $files[$i] == "..") continue;
                            $element = is_dir(($dir == "/" ? "" : $dir) . $files[$i]) ? "dire" : "file";
                            echo "<$element>" . htmlentities($files[$i]) . "</$element>";
                        }
                    } else {
                        $notice = "该文件夹不存在！($dir)";
                    }
                }
                ?>
            </div>
            <div id="editor" class="editor <?php echo !isset($data) ? "hidden" : ""; ?>">
                <div class="control-btn">
                    <btn id="save">保存</btn>
                    <btn id="reload">刷新</btn>
                    <btn id="download">下载</btn>
                    <btn id="view">预览</btn>
                    <btn id="showeditor">打开编辑器</btn>
                </div>
                <textarea id="code" name="data" <?php if (isset($data)) echo "data-file=\"" . $_GET["file"] . "\""; ?>><?php echo isset($data) ? htmlentities($data) : ""; ?></textarea>
            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/lib/codemirror.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/mode/htmlmixed/htmlmixed.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/mode/css/css.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/mode/javascript/javascript.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/mode/xml/xml.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/gh/codemirror/CodeMirror/mode/php/php.js" type="text/javascript"></script>
    <script src="https://adminx.xurl.ltd/js/index.js" type="text/javascript"></script>
    <!-- 提示消息 --> <?php if (isset($notice)) echo "<script>notice(\"$notice\")</script>"; ?>
</body>

</html>
