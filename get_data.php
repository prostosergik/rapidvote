<?php

ini_set('display_errors', '1');
error_reporting('E_ALL');

$json = '';
$poll_id = $_REQUEST['poll_id'];

if($poll_id == 'my_first_poll') {
	$json = json_encode(
		array(
			'status' => 1,
			'errors'=>'',
			'buttons'=>array(
				'yes' => 10,
				'no'=>12,
				'mayb'=>30
			)
		)
	);
} elseif ($poll_id == 'my_second_poll') {
	$json = json_encode(
		array(
			'status' => 1,
			'errors'=>'',
			'buttons'=>array(
				'shure' => "135",
				'not_shure'=>"55"
			)
		)
	);
} else {
	$json = json_encode(
		array(
			'status' => 0,
			'errors'=>'Poll id not set.',
			'buttons' => array()
		)
	);
}

echo "$.rapidvoteGetJSONpDataCallback('".$poll_id."', ".$json.");";
