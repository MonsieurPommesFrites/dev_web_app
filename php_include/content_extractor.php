<?php
// content_extractor.php - Extracts content from module files

function extractContent($content) {
    $allContent = array();
    
    // First, clean up popup divs while keeping the preview spans
    $content = preg_replace('/<div class="popup".*?<\/div>/s', '', $content);
    
    // Extract visuals (images and videos)
    $media = array();
    
    // Extract figures with images - more flexible pattern
    preg_match_all('/<figure[^>]*>.*?<img[^>]*src="([^"]*)".*?(?:<figcaption>(.*?)<\/figcaption>)?.*?<\/figure>/s', $content, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $media[] = array(
            'type' => 'visual',
            'subtype' => 'image',
            'src' => $match[1],
            'caption' => isset($match[2]) ? $match[2] : ''
        );
    }
    
    // Extract videos - more flexible pattern
    preg_match_all('/<video[^>]*>.*?<source[^>]*src="([^"]*)".*?<\/video>.*?(?:<figcaption>(.*?)<\/figcaption>)?/s', $content, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $media[] = array(
            'type' => 'visual',
            'subtype' => 'video',
            'src' => $match[1],
            'caption' => isset($match[2]) ? $match[2] : ''
        );
    }
    
    $allContent['vis'] = $media;
    
    // Extract other content types
    $contentTypes = array('exmp', 'defn', 'rmk', 'prop', 'thm', 'lem', 'cor');
    foreach ($contentTypes as $type) {
        $typeContent = array();
        preg_match_all('/<div class="' . $type . '".*?>(.*?)<\/div>/s', $content, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $typeContent[] = array(
                'type' => $type,
                'content' => $match[1]
            );
        }
        $allContent[$type] = $typeContent;
    }
    
    return $allContent;
}
?>