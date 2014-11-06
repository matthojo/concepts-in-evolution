<?php
/**
 * database.php
 *
 * @author Matthew Harrison-Jones <contact@matthojo.co.uk>
 * @package Selfish
 * @license
 * Date: 19/07/2012
 * Time: 13:08
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');

class database {
    public function getDatabaseData(){
        $dir = dirname(__FILE__);

        $dbhandle = new PDO('sqlite:'.$dir.'/database.sqlite3');
        $display = "";
        foreach ($dbhandle->query('SELECT player, score FROM score ORDER BY score DESC LIMIT 100') as $entry){
            $display .= '<li class="score"><span class="player">' . $entry['player'] . ':</span><span class="value">' . $entry['score'] .'</span></li>';
        }
        // Close file db connection
        $dbhandle = null;
        echo $display;

    }

    public function submitScore($player, $score){
            $dir = dirname(__FILE__);
        try {
            $dbhandle = new PDO('sqlite:'.$dir.'/database.sqlite3');
            $dbhandle->exec("INSERT INTO `score` (`score`, `player`) VALUES ('".$score."','".$player."');") or die(print_r($dbhandle->errorInfo(), true));

            // Close file db connection
            $dbhandle = null;
        }
        catch (PDOException $e)

        {

            echo $e->getMessage();

        }
    }

    public function submitData($player, $age, $gender){
        $dir = dirname(__FILE__);
        try {
            $dbhandle = new PDO('sqlite:'.$dir.'/database.sqlite3');
            $dbhandle->exec("INSERT INTO `data` (`player`, `age`, `gender`) VALUES ('".$player."','".$age."', '".$gender."');") or die(print_r($dbhandle->errorInfo(), true));

            // Close file db connection
            $dbhandle = null;
        }
        catch (PDOException $e)

        {

            echo $e->getMessage();

        }
    }

}
