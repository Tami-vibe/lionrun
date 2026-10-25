import type {Site} from "../site/blocks";
type History = {
    past: Site[];
    present: Site;
    future: Site[];
    group?: string;
};
type Action = {
    type: "set";
    next: Site;
    group?: string;
} | {
    type: "undo";
} | {
    type: "redo";
} | {
    type: "load";
    next: Site;
} | {
    type: "sync";
    next: Site;
};
export function historyReducer(state: History, action: Action): History {
    if (action.type === "load")
        return { past: [], present: action.next, future: [] };
    if (action.type === "sync") {
        const next = { ...state, present: action.next };
        delete next.group;
        return next;
    }
    if (action.type === "set") {
        if (action.group && state.group === action.group)
            return { ...state, present: action.next };
        const next: History = { past: [...state.past.slice(-39), state.present], present: action.next, future: [] };
        if (action.group) next.group = action.group;
        return next;
    }
    if (action.type === "undo" && state.past.length)
        return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
    if (action.type === "redo" && state.future.length)
        return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    return state;
}
