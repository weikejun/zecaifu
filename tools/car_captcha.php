<?php

$imgRoot = dirname(dirname(__FILE__))."/www/captcha";
$fName = $argv[1];
$imgInfo = getimagesize("$imgRoot/$fName.png");
$imgRes = imagecreatefrompng("$imgRoot/$fName.png");

$vectors = file(dirname(__FILE__).'/car_words_vec.uni.dat');
$chasLib = [];
foreach($vectors as $vector) {
	list($word, $cha) = explode("|", $vector);
	$cha = explode(",", trim($cha));
	$chasLib[$word][] = $cha;
}

$rgbWhite = ((255<<16)|(255<<8)|255);
$rgbNoise = false;
$colors = [];
for($x = 0; $x < $imgInfo[0]; $x++) {
	for($y = 0; $y < $imgInfo[1]; $y++) {
		$rgb = ImageColorAt($imgRes, $x, $y);
		if (isset($colors[$rgb])) {
			$colors[$rgb]++;
		} else {
			$colors[$rgb] = 1;
		}
	}
}
arsort($colors);
$colors = array_slice($colors, 1, 4, true);
$colors = array_keys($colors);
for($x = 0; $x < $imgInfo[0]; $x++) {
	for($y = 0; $y < $imgInfo[1]; $y++) {
		$rgb = ImageColorAt($imgRes, $x, $y);
		if ($rgb != $colors[0] 
			&& $rgb != $colors[1] 
			&& $rgb != $colors[2] 
			&& $rgb != $colors[3]){
			ImageSetPixel($imgRes, $x, $y, $rgbWhite);
		}
	}
}

$scalePixel = 10;
$timg = imagecreate($imgInfo[0] + $scalePixel, $imgInfo[1] + $scalePixel);
imagecolorallocate($timg, 255, 255, 255);
imagecopy($timg, $imgRes, $scalePixel/2, $scalePixel/2, 0, 0, $imgInfo[0], $imgInfo[1]);
$imgRes = $timg;

$poSumPre = 0;
$boundary = [0, 0, imagesy($imgRes), 0];
$wimgs = [];
for($x = 0; $x < imagesx($imgRes); $x++) {
	$poSum = 0;
	for($y = 0; $y < imagesy($imgRes); $y++) {
		$rgb = imagecolorat($imgRes, $x, $y);
		if ($rgb != $rgbWhite && $rgb != 16645629 && $rgb != 0) {
			$poSum++;
			if ($y < $boundary[2]) $boundary[2] = $y;
			if ($y > $boundary[3]) $boundary[3] = $y;
		}
	}
	if ($poSumPre == 0 && $poSum > 0) {
		$boundary[0] = $x-1;
	}
	if ($poSumPre > 0 && $poSum == 0) {
		$boundary[1] = $x;
		$boundary[2]--;
		$boundary[3]++;
		/*
		for($dx = $boundary[0]; $dx <= $boundary[1]; $dx++) {
			imagesetpixel($imgRes, $dx, $boundary[2], 0);
			imagesetpixel($imgRes, $dx, $boundary[3], 0);
		}
		for($dy = $boundary[2]; $dy <= $boundary[3]; $dy++) {
			imagesetpixel($imgRes, $boundary[0], $dy, 0);
			imagesetpixel($imgRes, $boundary[1], $dy, 0);
		}*/
		$areaMin = 999999;
		$areaMinArc = 0;
		$whRateMin = 10;
		$wimgMin = null;
		for($arc=-20.1; $arc<=20.1; $arc+=3) {
			$wimg = imagecreate($imgInfo[1], $imgInfo[1]);
			imagecolorallocate($wimg, 255, 255, 255);
			imagecopy($wimg, $imgRes, 0.5*($imgInfo[1] - ($boundary[1]-$boundary[0])), 0.5*($imgInfo[1]-$boundary[3]+$boundary[2]), $boundary[0], $boundary[2], $boundary[1]-$boundary[0]+1, $boundary[3]-$boundary[2]+1);
			$wimg = imagerotate($wimg, $arc, $rgbWhite);
			$boundaryArea = getBoundrayArea($wimg);
			$wimgW = abs($boundaryArea['boundary'][1]-$boundaryArea['boundary'][0]);
			$wimgH = abs($boundaryArea['boundary'][3]-$boundaryArea['boundary'][2]);
			if ($boundaryArea['area'] < $areaMin) {
				$areaMin = $boundaryArea['area'];
				$areaMinArc = $arc;
				$wimgMin = $wimg;
			}
			if ($wimgW/$wimgH < $whRateMin) {
				$whRateMin = $wimgW/$wimgH;
				$wimgMin = $wimg;
			}
		}
		$wimgs[] = $wimgMin;
		$boundary = [0, 0, $imgInfo[1], 0];
	}
	$poSumPre = $poSum;
}

$oimg = imagecreate($imgInfo[1]*4, $imgInfo[1]);
imagecolorallocate($oimg, 255, 255, 255);
$text = "";
for($i = 0; $i < count($wimgs); $i++) {
	$info = getBoundrayArea($wimgs[$i]);
	$boundary = $info['boundary'];
	//imagecopy($oimg, $wimgs[$i], $imgInfo[1]*$i + 0.5*($imgInfo[1] - ($boundary[1]-$boundary[0])), 0.5*($imgInfo[1]-$boundary[3]+$boundary[2]), $boundary[0], $boundary[2], $boundary[1]-$boundary[0]+1, $boundary[3]-$boundary[2]+1);
	$pRes = imagecrop($wimgs[$i], [
		'x' => $boundary[0],
		'y' => $boundary[2],
		'width' => $boundary[1] - $boundary[0] + 1,
		'height' => $boundary[3] - $boundary[2] + 1
	]);
	$text.=doOcr(getVector($pRes));
}

file_put_contents("$imgRoot/$fName.res", $text);
echo $text;
//imagepng($imgRes, "$imgRoot/$fName.mid.png");
//imagegif($oimg, "$imgRoot/$fName.gif");


function getBoundrayArea($res) {
	global $rgbWhite;
	$imgInfo = [imagesx($res), imagesy($res)];
	$poSumPre = 0;
	$boundary = [0, 0, $imgInfo[1], 0];
	for($x = 0; $x < $imgInfo[0]; $x++) {
		$poSum = 0;
		for($y = 0; $y < $imgInfo[1]; $y++) {
			$rgb = imagecolorat($res, $x, $y);
			if ($rgb != $rgbWhite && $rgb != 16645629) {
				$poSum++;
				if ($y < $boundary[2]) $boundary[2] = $y;
				if ($y > $boundary[3]) $boundary[3] = $y;
			}
		}
		if ($poSumPre == 0 && $poSum > 0) {
			$boundary[0] = $x-1;
		}
		if ($poSumPre > 0 && $poSum == 0) {
			$boundary[1] = $x;
			$boundary[2]--;
			$boundary[3]++;
			return [
				'boundary' => $boundary,
				'area' => ($boundary[1]-$boundary[0])*($boundary[3]-$boundary[2])
			];
		}
		$poSumPre = $poSum;
	}
}

function dumpRGB($rgb) {
	$r = ($rgb >> 16) & 0xFF;
	$g = ($rgb >> 8) & 0xFF;
	$b = $rgb & 0xFF;
	return [$r, $g, $b];
}

function getVector($pRes) {
	global $rgbWhite;
	$width = imagesx($pRes);
	$height = imagesy($pRes);
	$vector = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	$bx = [floor($width/4)-1,floor($width/4)*2-1,floor($width/4)*3-1,$width-1];
	$by = [floor($height/4)-1,floor($height/4)*2-1,floor($height/4)*3-1,$height-1];
	if ($width % 4 == 2) {
		$bx[2]+=2;
		$bx[1]+=1;
	}
	if ($width % 4 == 3) {
		$bx[2]+=3;
		$bx[1]+=2;
		$bx[0]+=1;
	}
	if ($height % 4 == 2) {
		$by[2]+=2;
		$by[1]+=1;
	}
	if ($height % 4 == 3) {
		$by[2]+=3;
		$by[1]+=2;
		$by[0]+=1;
	}
	for ($xx = 0; $xx < count($bx); $xx++) {
		for($yy = 0; $yy < count($by); $yy++) {
			$piTotal = 0;
			$piColor = 0;
			$xTo = $bx[$xx];
			$yTo = $by[$yy];
			$xFrom = ($xx == 0 ? 0 : $bx[$xx - 1] + 1);
			$yFrom = ($yy == 0 ? 0 : $by[$yy - 1] + 1);
			for($x = $xFrom; $x <= $xTo; $x++) {
				for($y = $yFrom; $y <= $yTo; $y++) {
					$piTotal++;
					$rgb = imagecolorat($pRes, $x, $y);
					if ($rgb != $rgbWhite && $rgb != 16645629) {
						$piColor++;
					}
				}
			}
			$vector[$xx*count($bx)+$yy] = intval($piColor/$piTotal*100);
		}
	}
	return $vector;
}

function doOcr($vector) {
	global $chasLib;
	$minDist = 10000000;
	$probChar = ''; 
	foreach($chasLib as $char => $vectors) {
		for($i = 0; $i < count($vectors); $i++) {
			$dist = 0;
			for($j = 0; $j < count($vectors[$i]); $j++) {
				$dist += (($vectors[$i][$j]-$vector[$j])*($vectors[$i][$j]-$vector[$j]));
			}
			if ($dist < $minDist) {
				$minDist = $dist;
				$probChar = $char;
			}
		}
	}
	return $probChar;
}
