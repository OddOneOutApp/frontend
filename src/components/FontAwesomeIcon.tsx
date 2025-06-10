import { Component } from "solid-js";
import { template } from "solid-js/web";
import { icon, IconDefinition } from "@fortawesome/fontawesome-svg-core";

const svgCache = new Map<IconDefinition, Element>();
const getSvg = (i: IconDefinition) =>
    (
        svgCache.get(i) ??
        svgCache.set(i, template(icon(i).html.join(""), false, false)()).get(i)
    ).cloneNode(true);

export const FontAwesomeIcon: Component<{
    icon: IconDefinition;
    class?: string;
    title?: string;
}> = (props) => {
    const svg = getSvg(props.icon);
    if (svg instanceof SVGElement && props.title) {
        const title = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
        );
        title.textContent = props.title;
        const titleId = `title-${Math.random().toString(36).substring(2, 11)}`;
        title.id = titleId;
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-labelledby", titleId);
        const comment = document.createComment(
            "Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc."
        );
        svg.insertBefore(comment, svg.firstChild);
        svg.insertBefore(title, svg.firstChild);
    }
    return <span class={props.class}>{svg}</span>;
};
