export const loader = `<div class="animate-spin border-t-black border-b-black border-2 w-8 h-8 rounded-full mx-auto"></div>`;

export function getLoader(size: string) {
    return `<div class="animate-spin border-t-black border-b-black border-2 rounded-full mx-auto" style="height: ${size}; width: ${size};"></div>`;
}
export function titleCase(str: string) {
    var splitStr = str.toLowerCase().split(" ");
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] =
            splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(" ");
}
export function markdownToPlainText(markdown: string) {
    // Remove inline links
    markdown = markdown.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1');

    // Remove images
    markdown = markdown.replace(/\!\[([^\]]+)\]\(([^\)]+)\)/g, '');

    // Remove headers
    markdown = markdown.replace(/#{1,6}\s+([^#]+)/g, '$1');

    // Remove emphasis
    markdown = markdown.replace(/(\*|_){1,2}([^*_]+)(\*|_){1,2}/g, '$2');

    // Remove code blocks
    markdown = markdown.replace(/```([^`]+)```/g, '');

    // Remove code spans
    markdown = markdown.replace(/`([^`]+)`/g, '');

    // Remove horizontal rules
    markdown = markdown.replace(/-{3,}/g, '');

    // Remove blockquotes
    markdown = markdown.replace(/>\s*([^]+)/g, '');

    // Remove unordered lists
    markdown = markdown.replace(/^\s*([-*+])\s+([^]+)/gm, '$2');

    // Remove ordered lists
    markdown = markdown.replace(/^\s*(\d+\.)\s+([^]+)/gm, '$2');

    // Remove line breaks
    markdown = markdown.replace(/\n+/g, ' ');

    return markdown.trim();
}

export function dateToHTMLDatetime(date: Date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * -60 * 1000).toISOString().slice(0, 19);
}