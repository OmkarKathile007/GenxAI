package com.genaibackend.aibackend.service;

import java.util.HashMap;
import java.util.Map;

/**
 * Single source of truth that maps a business's chosen {@code agentVoice} label
 * to a Vapi voice configuration. Supports Azure neural voices (reliable Indian
 * accents) and ElevenLabs voices (premium, multilingual), plus a custom
 * ElevenLabs voice id via the {@code "11labs:<voiceId>"} prefix.
 *
 * The frontend voice picker mirrors these labels.
 */
public final class VoiceCatalog {

    private VoiceCatalog() {}

    public static Map<String, Object> resolve(String agentVoice) {
        String choice = agentVoice == null ? "" : agentVoice.trim();
        String lc = choice.toLowerCase();

        // Custom ElevenLabs voice id, e.g. "11labs:21m00Tcm4TlvDq8ikWAM"
        if (lc.startsWith("11labs:") || lc.startsWith("elevenlabs:")) {
            String id = choice.substring(choice.indexOf(':') + 1).trim();
            if (!id.isEmpty()) return elevenlabs(id);
        }

        // ElevenLabs presets (premade public voice ids)
        if (lc.contains("elevenlabs") || lc.contains("11labs")) {
            if (lc.contains("aria")) return elevenlabs("9BWtsMINqrJLrRacOk9x");
            if (lc.contains("sarah")) return elevenlabs("EXAVITQu4vr4xnSDxMaL");
            if (lc.contains("rachel")) return elevenlabs("21m00Tcm4TlvDq8ikWAM");
            if (lc.contains("charlotte")) return elevenlabs("XB0fDUnXU5powFXDhCwa");
            if (lc.contains("matilda")) return elevenlabs("XrExE9yKIg1WjnnlVkGX");
            if (lc.contains("adam")) return elevenlabs("pNInz6obpgDQGcFmaJgB");
            if (lc.contains("brian")) return elevenlabs("nPczCjzI2devNBz1zQrb");
            return elevenlabs("EXAVITQu4vr4xnSDxMaL"); // default ElevenLabs female (Sarah)
        }

        // Azure Indian neural voices (genuinely Indian-accented, always available)
        String voiceId;
        if (lc.contains("hindi") && lc.contains("male")) voiceId = "hi-IN-MadhurNeural";
        else if (lc.contains("hindi")) voiceId = "hi-IN-SwaraNeural";
        else if (lc.contains("male")) voiceId = "en-IN-PrabhatNeural";
        else voiceId = "en-IN-NeerjaNeural"; // default: Indian English female
        return Map.of("provider", "azure", "voiceId", voiceId);
    }

    private static Map<String, Object> elevenlabs(String voiceId) {
        Map<String, Object> m = new HashMap<>();
        m.put("provider", "11labs");
        m.put("voiceId", voiceId);
        m.put("model", "eleven_turbo_v2_5"); // multilingual, low-latency
        return m;
    }
}
