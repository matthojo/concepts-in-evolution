<?php
/**
 * submitScore.php
 *
 * @copyright Matthew Harrison-Jones <contact@matthojo.co.uk>
 * @author Matthew Harrison-Jones <contact@matthojo.co.uk>
 * @package
 * @license
 * Date: 19/07/2012
 * Time: 14:12
 */

require_once '../database.php';

$player = $_POST['player'];
$score = $_POST['score'];

if($player & $score){

$db = new database();

$db->submitScore($player, $score);

$db->getDatabaseData();

}else{
    echo "Fail!";
}
