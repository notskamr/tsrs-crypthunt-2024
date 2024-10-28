let words: string[] = [];

// async block
const setWords = async () => {
    const wordsFetch = await fetch('https://raw.githubusercontent.com/notskamr/public-ch-utils/main/clean_words.txt');
    words = (await wordsFetch.text()).split('\n').map(w => w.trim());
};

export async function genPassword(length: number) {
    if (words.length === 0) {
        await setWords();
    }
    let password: string[] = [];
    for (let i = 0; i < length; i++) {
        password.push(words[Math.floor(Math.random() * words.length - 1)]);
    }
    return password.join('-');
}