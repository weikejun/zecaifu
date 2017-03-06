# zecaifu

Process cycle: set_user_list.sh -> create_listeners.sh[multiprocess] -> create_detectors.sh -> clear_gar.sh
.
├── amount // 存放用户账户余额
│   └── 13811311608
├── clear_gar.sh // 垃圾清理脚本
├── common.sh // 公共头部
├── config // 配置文件
│   ├── apache.conf // Web virtual host
│   └── crontab.dat // 定时任务
├── cookies // 页面cookie
│   ├── 13811311608_1488768601972974025_login
│   └── 13811311608_1488768601974453302
├── create_detectors.sh // 众筹目标探测器
├── create_listeners.sh // 众筹监听器
├── get_amount.sh // 取余额脚本
├── http // 页面请求缓存
│   ├── callback_13811311608_1488765001498127236_UqcZa7J6
│   ├── detail_13811311608_1488765001498127236_UqcZa7J6
│   ├── detail_post_13811311608_1488765001498127236_UqcZa7J6
│   ├── pass_verify_13811311608_1488765001498127236_UqcZa7J6
│   ├── paysign_13811311608_1488765001498127236_UqcZa7J6
│   ├── pay_submit_13811311608_1488765001498127236_UqcZa7J6
│   ├── return_13811311608_1488765001498127236_UqcZa7J6
│   ├── submit_13811311608_1488765001498127236_UqcZa7J6
│   ├── transfer_13811311608_1488765001498127236_UqcZa7J6
│   ├── transfer_form_13811311608_1488765001498127236_UqcZa7J6
│   └── user_login_13811311608.http
├── init_project.sh // 项目初始化脚本
├── log // 日志
│   ├── 20170306
│   └── clear_20170306
├── payPass.txt
├── process_bid.sh // 众筹过程处理脚本
├── README.md // 说明文档
├── set_user_list.sh // 设置众筹用户
├── tigger // 众筹触发标识
│   ├── hqd3l79a_done
│   └── Zqd3krk6_start
├── tools // 工具库
│   ├── encrypt.js // RSA加密
│   ├── form_serialize.php // 表单序列化
│   └── urlencode.php // urlencode
├── user.list // 参与众筹用户列表
├── user_login.sh // 用户登录脚本
├── user_map.sh // 登记用户列表
└── www // 交互界面
    ├── actLog.php
    ├── css
    │   └── amazeui.min.css
    ├── index.php
    ├── js
    │   └── jquery-3.1.1.min.js
    ├── monitor.php
    └── user.php
