<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Functionality extends CI_Controller {

    public $data = array();

    function __construct()
    {
        parent::__construct();
    }

    function rapidvote($mode = '', $poll_id = '') {
        // header('Content-type: application/json');
        header('Content-type: application/javascript');

        if(empty($poll_id)) {
            $json = array(
                'status' => 0,
                'errors'=>'Poll id not set.',
                'poll_id' => $poll_id,
                'buttons' => new stdClass()
            );
            echo json_encode($json);
            exit;
        }

        $domain = domain();

        $dbrecord_not_exists = false;

        $buttons_data = json_decode(@$this->db->select('buttons_json')->from('rapidvote')->where(array('poll_id'=>$poll_id, 'domain' => $domain))->get()->row()->buttons_json);

        if(!$buttons_data) {
            $buttons_data = new stdClass();
            $dbrecord_not_exists = true;
        }

        if($mode == 'get') {

            $json = array(
                'status' => 1,
                'errors'=>'',
                'poll_id' => $poll_id,
                'buttons'=> $buttons_data
            );

            echo "$.rapidvoteGetJSONpDataCallback('".$poll_id."', ".json_encode($json).");";
            exit;

        } elseif($mode == 'set') {

            $button = $this->input->get('button');
            $action = $this->input->get('action', 'inc');

            $buttons_data_unchanged = clone $buttons_data;

            $status = 1;
            $errors = '';

            if(!isset($buttons_data->{$button})) {
                $buttons_data->{$button} = 0;
            }

            if($action == 'inc' || $dbrecord_not_exists) {
                $buttons_data->{$button}++;
            } elseif($action == 'dec') {
                if($buttons_data->{$button} > 0) $buttons_data->{$button}--;
            } else {
                $status = 0;
                $errors = "Wrong inc/dec mode.";
            }

            if($status == 1) {

                if($dbrecord_not_exists) {
                    $query = $this->db->insert('rapidvote', array('buttons_json'=>json_encode($buttons_data), 'poll_id'=>$poll_id, 'domain' => $domain));
                } else {
                    $query = $this->db->update('rapidvote', array('buttons_json'=>json_encode($buttons_data)), array('poll_id'=>$poll_id, 'domain' => $domain));
                }


                if(!$query) {
                    $status = 0;
                    $errors = "Database errors: ".$this->db->_error_message();
                }
            }

            $json = array(
                'status' => $status,
                'errors'=> $errors,
                'poll_id' => $poll_id,
                'button' => $button,
                'incremented' => ($action == 'inc' || $dbrecord_not_exists) ? true : false,
                'buttons'=> ($status == 1) ? $buttons_data : $buttons_data_unchanged
            );

            echo "$.rapidvoteSetJSONpDataCallback('".$poll_id."', ".json_encode($json).");";
            exit;

        } else {
            $json = array(
                'status' => 0,
                'errors'=>'Mode not set or wrong.',
                'poll_id' => $poll_id,
                'buttons' => new stdClass()
            );
            echo json_encode($json);
            exit;
        }

    }


}
?>