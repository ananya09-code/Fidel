import { Image, type ImageSourcePropType } from "react-native";
import { characterFor, characterForQuest, characterForTopic, type CharacterRole } from "@/lib/character-cast";
import type { LearningLanguage } from "@/lib/languages";

const sprites: Record<LearningLanguage, Record<string, ImageSourcePropType>> = {
  om: {
    gammachuu: require("../assets/characters/om/gammachuu.png"), hawwii: require("../assets/characters/om/hawwii.png"),
    tolaa: require("../assets/characters/om/tolaa.png"), ayyaantuu: require("../assets/characters/om/ayyaantuu.png"),
    nagaa: require("../assets/characters/om/nagaa.png"), caalaa: require("../assets/characters/om/caalaa.png"),
    aminaa: require("../assets/characters/om/aminaa.png"), hundaa: require("../assets/characters/om/hundaa.png"),
  },
  am: {
    abebe: require("../assets/characters/am/abebe.png"), tsehay: require("../assets/characters/am/tsehay.png"),
    dawit: require("../assets/characters/am/dawit.png"), almaz: require("../assets/characters/am/almaz.png"),
    helen: require("../assets/characters/am/helen.png"), haile: require("../assets/characters/am/haile.png"),
    aisha: require("../assets/characters/am/aisha.png"), kidan: require("../assets/characters/am/kidan.png"),
  },
  ti: {
    tesfay: require("../assets/characters/ti/tesfay.png"), berhan: require("../assets/characters/ti/berhan.png"),
    dawit: require("../assets/characters/ti/dawit.png"), almaz: require("../assets/characters/ti/almaz.png"),
    selam: require("../assets/characters/ti/selam.png"), yohannes: require("../assets/characters/ti/yohannes.png"),
    amina: require("../assets/characters/ti/amina.png"), kidan: require("../assets/characters/ti/kidan.png"),
  },
};

export function Character({ language, role = "student", topic, questId, width = 72 }: {
  language: LearningLanguage; role?: CharacterRole; topic?: string; questId?: string; width?: number;
}) {
  const member = questId ? characterForQuest(language, questId, "guide") : topic ? characterForTopic(language, topic) : characterFor(language, role);
  return <Image accessible={false} source={sprites[language][member.id]} resizeMode="contain" style={{ width, height: width * 4 / 3 }} />;
}
