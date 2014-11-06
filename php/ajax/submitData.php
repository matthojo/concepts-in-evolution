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

$player = $_POST['name'];
$age = $_POST['age'];
$gender = $_POST['gender'];

if($player && $age && $gender){

$db = new database();

$db->submitData($player, $age, $gender);

$db->getDatabaseData();

}else{
    echo "Fail!";
}
