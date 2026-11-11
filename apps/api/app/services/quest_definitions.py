"""Versioned, authored adventures. Never generated from arbitrary learner input.

English dialogue scaffolds individual native words, not full-sentence fluency.
Native-speaker editorial review of the vocabulary variants remains a release check.
"""
import re
import unicodedata

# key: (English meaning, Amharic meaning, Oromo, Amharic, Tigrinya)
LEXICON = {
    "hello": ("hello", "ሰላም", "akkam", "ሰላም", "ሰላም"),
    "water": ("water", "ውሃ", "bishaan", "ውሃ", "ማይ"),
    "coffee": ("coffee", "ቡና", "buna", "ቡና", "ቡን"),
    "please": ("please", "እባክህ", "maaloo", "እባክህ", "በጃኻ"),
    "thanks": ("thank you", "አመሰግናለሁ", "galatoomi", "አመሰግናለሁ", "የቐንየለይ"),
    "how": ("how are you", "እንዴት ነህ", "akkam jirta", "እንዴት ነህ", "ከመይ ኣለኻ"),
    "good": ("good", "ጥሩ", "gaarii", "ጥሩ", "ጽቡቕ"),
    "bread": ("bread", "ዳቦ", "buddeena", "ዳቦ", "ባኒ"),
    "two": ("two", "ሁለት", "lama", "ሁለት", "ክልተ"),
    "mother": ("mother", "እናት", "haadha", "እናት", "ኣደ"),
    "father": ("father", "አባት", "abbaa", "አባት", "ኣቦ"),
}
VARIANTS = {("om", "hello"): ["akkam jirtu"], ("om", "thanks"): ["galatoomaa"],
            ("am", "please"): ["እባክሽ", "እባክዎ", "እባክዎት"], ("am", "water"): ["ዉሃ"],
            ("am", "how"): ["እንዴት ነሽ"], ("ti", "how"): ["ከመይ ኣለኺ"],
            ("ti", "please"): ["በጃኺ"]}


def normalize(value):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", value).strip().lower().replace("’", "'").replace("‘", "'")).strip(" .,!?።፣፧፡")


def term(language, key):
    english, amharic, *texts = LEXICON[key]
    return {"key": key, "text": texts[("om", "am", "ti").index(language)], "english": english,
            "amharic": amharic, "alternatives": VARIANTS.get((language, key), [])}


def matches(language, key, value):
    word = term(language, key)
    return normalize(value) in {normalize(text) for text in [word["text"], *word["alternatives"]]}


def valid_name(value, language):
    name = unicodedata.normalize("NFC", value or "").strip()
    if not 1 <= len(name) <= 40 or not any(c.isalpha() for c in name):
        return False
    for c in name:
        if c in " '-’" or unicodedata.category(c).startswith("M"):
            continue
        if not c.isalpha():
            return False
        if language == "om" and "LATIN" not in unicodedata.name(c, ""):
            return False
        if language != "om" and "ETHIOPIC" not in unicodedata.name(c, ""):
            return False
    return True


def definitions(language):
    def step(key, prompt, accepts=(), kind="word"):
        return {"id": key, "prompt": prompt, "accepts": list(accepts), "kind": kind}
    specs = [
        ("intro", "Meet your guide", "Your name. Your first hello.", "guide", ["hello"], [
            step("name", "Welcome! I’m your village guide. What’s your name?", kind="name"),
            step("hello", "Lovely to meet you, {name}. Choose a word to say hello.", ["hello"])]),
        ("cafe", "At the café", "A drink and a little kindness.", "host", ["hello", "water", "coffee", "please", "thanks"], [
            step("drink", "Welcome to the café. Would you like water or coffee?", ["water", "coffee"]),
            step("please", "A lovely choice. Which word makes your order more polite?", ["please"]),
            step("thanks", "Here’s your drink. How would you thank your host?", ["thanks"])]),
        ("neighbor", "Meet a neighbor", "Make a new face feel familiar.", "guide", ["hello", "how", "good", "thanks"], [
            step("hello", "A neighbor waves from the garden. Greet them.", ["hello"]),
            step("how", "Ask your neighbor how they are.", ["how"]),
            step("good", "They ask how you are too. Choose the word for good.", ["good"]),
            step("thanks", "A friendly little chat. Thank them before you go.", ["thanks"])]),
        ("market", "At the market", "Pick up a few things for home.", "host", ["bread", "two", "please", "thanks"], [
            step("bread", "The stall smells wonderful. Ask for bread.", ["bread"]),
            step("two", "How many would you like? Choose two.", ["two"]),
            step("please", "Add a polite word to your order.", ["please"]),
            step("thanks", "Your bread is wrapped. Thank the seller.", ["thanks"])]),
        ("family", "A family visit", "Familiar words, familiar faces.", "guide", ["hello", "mother", "father", "thanks"], [
            step("hello", "The family welcomes you inside. Say hello.", ["hello"]),
            step("parent", "Introduce a family member. Choose mother or father.", ["mother", "father"]),
            step("thanks", "You’ve been made to feel at home. Thank your family.", ["thanks"])]),
    ]
    return [{"id": key, "version": 1, "title": title, "description": description, "character": character,
             "prerequisite": specs[i-1][0] if i else None, "required": [term(language, word) for word in required],
             "steps": steps} for i, (key, title, description, character, required, steps) in enumerate(specs)]
