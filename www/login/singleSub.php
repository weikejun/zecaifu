<?php

$dir = dirname(dirname(__FILE__));
if(isset($_GET['captcha'])) {
	foreach($_GET['captcha'] as $fname => $capVal) {
	echo ("$dir/captcha/login/$fname".'.res');
		if(trim($capVal) === "") continue;
		file_put_contents("$dir/captcha/login/$fname".'.res', $capVal);
	}
}

echo 'ok';
