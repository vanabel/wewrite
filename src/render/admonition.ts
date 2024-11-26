import { IconName } from "@fortawesome/fontawesome-svg-core";

export const ADMONITION_MAP: Record<string, Admonition> = {
    note: {
        type: "note",
        color: "68, 138, 255",
        icon: {
            type: "font-awesome",
            name: "pencil-alt"
        },
        command: false,
        noTitle: false
    },
    seealso: {
        type: "note",
        color: "68, 138, 255",
        icon: {
            type: "font-awesome",
            name: "pencil-alt"
        },
        command: false,
        noTitle: false
    },
    abstract: {
        type: "abstract",
        color: "0, 176, 255",
        icon: {
            type: "font-awesome",
            name: "book"
        },
        command: false,
        noTitle: false
    },
    summary: {
        type: "abstract",
        color: "0, 176, 255",
        icon: {
            type: "font-awesome",
            name: "book"
        },
        command: false,
        noTitle: false
    },
    tldr: {
        type: "abstract",
        color: "0, 176, 255",
        icon: {
            type: "font-awesome",
            name: "book"
        },
        command: false,
        noTitle: false
    },
    info: {
        type: "info",
        color: "0, 184, 212",
        icon: {
            type: "font-awesome",
            name: "info-circle"
        },
        command: false,
        noTitle: false
    },
    todo: {
        type: "info",
        color: "0, 184, 212",
        icon: {
            type: "font-awesome",
            name: "info-circle"
        },
        command: false,
        noTitle: false
    },
    tip: {
        type: "tip",
        color: "0, 191, 165",
        icon: {
            type: "font-awesome",
            name: "fire"
        },
        command: false,
        noTitle: false
    },
    hint: {
        type: "tip",
        color: "0, 191, 165",
        icon: {
            type: "font-awesome",
            name: "fire"
        },
        command: false,
        noTitle: false
    },
    important: {
        type: "tip",
        color: "0, 191, 165",
        icon: {
            type: "font-awesome",
            name: "fire"
        },
        command: false,
        noTitle: false
    },
    success: {
        type: "success",
        color: "0, 200, 83",
        icon: {
            type: "font-awesome",
            name: "check-circle"
        },
        command: false,
        noTitle: false
    },
    check: {
        type: "success",
        color: "0, 200, 83",
        icon: {
            type: "font-awesome",
            name: "check-circle"
        },
        command: false,
        noTitle: false
    },
    done: {
        type: "success",
        color: "0, 200, 83",
        icon: {
            type: "font-awesome",
            name: "check-circle"
        },
        command: false,
        noTitle: false
    },
    question: {
        type: "question",
        color: "100, 221, 23",
        icon: {
            type: "font-awesome",
            name: "question-circle"
        },
        command: false,
        noTitle: false
    },
    help: {
        type: "question",
        color: "100, 221, 23",
        icon: {
            type: "font-awesome",
            name: "question-circle"
        },
        command: false,
        noTitle: false
    },
    faq: {
        type: "question",
        color: "100, 221, 23",
        icon: {
            type: "font-awesome",
            name: "question-circle"
        },
        command: false,
        noTitle: false
    },
    warning: {
        type: "warning",
        color: "255, 145, 0",
        icon: {
            type: "font-awesome",
            name: "exclamation-triangle"
        },
        command: false,
        noTitle: false
    },
    caution: {
        type: "warning",
        color: "255, 145, 0",
        icon: {
            type: "font-awesome",
            name: "exclamation-triangle"
        },
        command: false,
        noTitle: false
    },
    attention: {
        type: "warning",
        color: "255, 145, 0",
        icon: {
            type: "font-awesome",
            name: "exclamation-triangle"
        },
        command: false,
        noTitle: false
    },
    failure: {
        type: "failure",
        color: "255, 82, 82",
        icon: {
            type: "font-awesome",
            name: "times-circle"
        },
        command: false,
        noTitle: false
    },
    fail: {
        type: "failure",
        color: "255, 82, 82",
        icon: {
            type: "font-awesome",
            name: "times-circle"
        },
        command: false,
        noTitle: false
    },
    missing: {
        type: "failure",
        color: "255, 82, 82",
        icon: {
            type: "font-awesome",
            name: "times-circle"
        },
        command: false,
        noTitle: false
    },
    danger: {
        type: "danger",
        color: "255, 23, 68",
        icon: {
            type: "font-awesome",
            name: "bolt"
        },
        command: false,
        noTitle: false
    },
    error: {
        type: "danger",
        color: "255, 23, 68",
        icon: {
            type: "font-awesome",
            name: "bolt"
        },
        command: false,
        noTitle: false
    },
    bug: {
        type: "bug",
        color: "245, 0, 87",
        icon: {
            type: "font-awesome",
            name: "bug"
        },
        command: false,
        noTitle: false
    },
    example: {
        type: "example",
        color: "124, 77, 255",
        icon: {
            type: "font-awesome",
            name: "list-ol"
        },
        command: false,
        noTitle: false
    },
    quote: {
        type: "quote",
        color: "158, 158, 158",
        icon: {
            type: "font-awesome",
            name: "quote-right"
        },
        command: false,
        noTitle: false
    },
    cite: {
        type: "quote",
        color: "158, 158, 158",
        icon: {
            type: "font-awesome",
            name: "quote-right"
        },
        command: false,
        noTitle: false
    }
};

export type DownloadableIconPack = "octicons" | "rpg";

export const DownloadableIcons: Record<DownloadableIconPack, string> = {
    octicons: "Octicons",
    rpg: "RPG Awesome"
} as const;


export type AdmonitionIconDefinition = {
    type?: IconType;
    // name?: IconName | ObsidianIconNames | string;
    name?: IconName | string;
};

export type IconType =
    | "font-awesome"
    | "obsidian"
    | "image"
    | DownloadableIconPack;

export type AdmonitionIconName = AdmonitionIconDefinition["name"];
export type AdmonitionIconType = AdmonitionIconDefinition["type"];
export interface Admonition {
    type: string;
    title?: string;
    icon: AdmonitionIconDefinition;
    color: string;
    command: boolean;
    injectColor?: boolean;
    noTitle: boolean;
    copy?: boolean;
}

export interface NestedAdmonition {
    type: string;
    start: number;
    end: number;
    src: string;
}