<?php

$dir = dirname(__FILE__);
$files = scandir($dir);

$data['res'] = 0;
$data['srv_t'] = $_GET['srv_t'] ? $_GET['srv_t'] : 0;

foreach($files as $f) {
	$finfo = pathinfo($f);
	if($finfo['extension'] == 'gif') {
		$flmtm = filemtime($f);
		if(date('Ymd', $flmtm) == date('Ymd') && $flmtm >= $data['srv_t']) {
			$capCode = '';
			if(file_exists($finfo['filename'].'.res')) {
				$capCode = file_get_contents($finfo['filename'].'.res');
			}
			$data['res']++;
			$data['caps'][] = [
				'img_src' => $f,
				'cap_code' => $capCode,
				'file_name' => $finfo['filename'],
				];
		}
	}
}

$data['srv_t'] = time();
echo json_encode($data);
