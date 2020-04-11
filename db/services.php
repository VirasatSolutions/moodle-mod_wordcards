<?php
/**
 * Services definition.
 *
 * @package mod_wordcards
 * @author  Frédéric Massart - FMCorz.net
 */

$functions = array(

    'mod_wordcards_mark_as_seen' => array(
        'classname'   => 'mod_wordcards_external',
        'methodname'  => 'mark_as_seen',
        'description' => 'Mark a term as seen.',
        'capabilities'=> 'mod/wordcards:view',
        'type'        => 'write',
        'ajax'        => true,
    ),

    'mod_wordcards_report_successful_association' => array(
        'classname'   => 'mod_wordcards_external',
        'methodname'  => 'report_successful_association',
        'description' => 'Reports a successful association of terms.',
        'capabilities'=> 'mod/wordcards:view',
        'type'        => 'write',
        'ajax'        => true,
    ),

    'mod_wordcards_report_failed_association' => array(
        'classname'   => 'mod_wordcards_external',
        'methodname'  => 'report_failed_association',
        'description' => 'Reports a failed association of terms.',
        'capabilities'=> 'mod/wordcards:view',
        'type'        => 'write',
        'ajax'        => true,
    ),

    'mod_wordcards_fetch_phonemes' => array(
            'classname'   => 'mod_wordcards_external',
            'methodname'  => 'fetch_phonemes',
            'description' => 'fetches a list of phonemes for one or more term',
            'capabilities'=> 'mod/wordcards:view',
            'type'        => 'read',
            'ajax'        => true,
    ),

);
