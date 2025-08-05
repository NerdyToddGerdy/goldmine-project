export function showFloatingText(amount: number, x: number, y:number, isNegative = false) {
    const container = document.getElementById("floating-feedback")!;
    const text = document.createElement("div");

    text.className = "feedback-text" + (isNegative ? " negative" : "");
    text.innerText = `${isNegative ? "-" : "+"}$${amount}`;

    // Position text
    text.style.left = `${x}px`;
    text.style.top = `${y}px`;

    container.appendChild(text);

    // Remove after animation
    setTimeout(() => container.removeChild(text), 1000);
}