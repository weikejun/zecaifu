<?php

$dir = dirname(dirname(__FILE__))."/captcha/login";
$files = scandir($dir);

$data['res'] = 0;
$data['srv_t'] = $_GET['srv_t'] ? $_GET['srv_t'] : 0;

foreach($files as $f) {
	$finfo = pathinfo($f);
	if($finfo['extension'] == 'png') {
		$flmtm = filemtime("$dir/$f");
		if(date('Ymd', $flmtm) == date('Ymd') && $flmtm >= $data['srv_t']) {
			$capCode = '';
			if(file_exists("$dir/".$finfo['filename'].'.res')) {
				$capCode = file_get_contents("$dir/".$finfo['filename'].'.res');
			}
			$data['res']++;
			$data['caps'][] = [
				'img_src' => "/captcha/login/$f",
				'cap_code' => $capCode,
				'file_name' => $finfo['filename'],
				];
		}
	}
}

$data['srv_t'] = time();
shuffle($data['caps']);
echo json_encode($data);
