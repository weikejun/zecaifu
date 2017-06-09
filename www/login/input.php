
<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>ZeRobot - 登录验证码录入</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no">
  <meta name="renderer" content="webkit">
  <meta http-equiv="Cache-Control" content="no-siteapp" />
  <link rel="alternate icon" type="image/png" href="/i/favicon.png">
  <link rel="stylesheet" href="/css/amazeui.min.css"/>
  <style>
    .header {
      text-align: center;
    }
    .header h1 {
      font-size: 200%;
      color: #333;
      margin-top: 30px;
    }
    .header p {
      font-size: 14px;
    }
    .selFont {
      padding: 12px;
      font-size: 20px;
      cursor: pointer;
      border: solid;
    }
  </style>
</head>
<body>
<div class="header">

  <hr />
</div>
<div class="am-g">
  <div class="am-u-lg-6 am-u-md-8 am-u-sm-centered">
    <h3>登录验证码录入(时间:<span id="now_time">--:--:--</span>)</h3>
    <hr>
    <form id="sub_form" method="post" class="am-form" action="submit.php">
      <div id="inputs"></div>
      <div class="am-cf"></div>
    </form>
    <hr>
    <script>var dt=new Date();document.write('<p>© '+dt.getFullYear()+' Jimwei </p>');</script>
  </div>
</div>
<script src="/js/jquery-3.1.1.min.js"></script>
<script>
var srvTime = 0;
var inputTpl = '<label id="lable_captcha[$FILE_NAME$]" for="captcha[$FILE_NAME$]"><img style="width:231px;height:84px" id="img_captcha[$FILE_NAME$]" src="$IMG_SRC$"></label><input autocomplete="off" type="text" name="captcha[$FILE_NAME$]" id="captcha[$FILE_NAME$]" value="$CAP_CODE$" onblur="blurSubmit(this);" onkeyup="autoSub(this)">';
function blurSubmit(inst) {
	$.ajax({
		url: "singleSub.php?"+$(inst).attr('id')+"="+$(inst).val(),
			type: "GET",
			success: function(data) {}
	});	
};
function autoSub(inst) {
	if ($(inst).val().length == 4) {
		blurSubmit(inst);
		var fo = false;
		$('input').each(function() {
			if (fo) return;
			if ($(this).val() == "") {
				$(this).focus();
				fo = true;
			}
		});
	}
}
var delStack = {};
(syncSrvDate = function() {
	$.ajax({
		url: "syncCap.php?srv_t=" + srvTime,
			type: "GET",
			dataType: "json",
			success: function(data, status, xhr) {
				if(data.res > 0) {
					for(i = 0; i < data.res; i++) {
						idStr = $.escapeSelector("captcha["+data.caps[i].file_name+"]"); 
						delStack[idStr] = [];
						if($("#"+idStr).length > 0) {
							$("#img_"+idStr).attr("src", data.caps[i].img_src+"?_="+Math.random());
							$("#"+idStr).val(data.caps[i].cap_code);

						} else {
							$("#inputs").append(inputTpl.replace(/\$IMG_SRC\$/g, data.caps[i].img_src).replace(/\$CAP_CODE\$/g, data.caps[i].cap_code).replace(/\$FILE_NAME\$/g, data.caps[i].file_name));
						}
						if ($("input").length == 1) $("#"+idStr).focus();
					}		
				}
				srvTime = data.srv_t;
				setTimeout(function() {
					syncSrvDate();
				}, 300);
			}
	})
})();
setInterval(function() {
	var dt = new Date();
	$('#now_time').html(dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds());
}, 1000);
</script>
</body>
</html>

