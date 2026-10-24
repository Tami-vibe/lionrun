import type {Site} from "../site/blocks";
type History = {
    past: Site[];
    present: Site;
    future: Site[];
};
type Action = {
    type: "set";
    next: Site;
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
    if (action.type === "sync")
        return { ...state, present: action.next };
    if (action.type === "set")
        return { past: [...state.past.slice(-39), state.present], present: action.next, future: [] };
    if (action.type === "undo" && state.past.length)
        return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
    if (action.type === "redo" && state.future.length)
        return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    return state;
}
