import {buttonIconSide, type ButtonData} from "../blocks";
import {Icon} from "../icons";
export {Icon};
export {safeHref} from "../safe-href";
export function SectionHeading({content}:{content:import('../blocks').BlockContent}) {
  return <div className="section-heading-copy">{content.smallLabel&&<span className="section-kicker">{content.smallLabel}</span>}<h2>{content.title}</h2>{content.description&&<p className="section-lede">{content.description}</p>}{content.showBody&&content.body?.trim()&&<p className="section-body">{content.body}</p>}</div>;
}
export function buttonContents(button: Pick<ButtonData, "icon" | "label" | "iconPosition">, size = 28) {
  const icon = <Icon name={button.icon} size={size}/>;
  const label = <span>{button.label}</span>;
  return buttonIconSide(button) === "left" ? <>{icon}{label}</> : <>{label}{icon}</>;
}
export const buttonAppearance=(button:ButtonData)=>({color:button.textColor,backgroundColor:button.fillColor,borderColor:button.fillColor});
export function SectionButtons({content,link}:{content:import('../blocks').BlockContent;link:(href:string,id?:string|null)=>React.AnchorHTMLAttributes<HTMLAnchorElement>}) {
  return <div className="hero-buttons">{content.buttons.filter((button,i)=>button.label&&(i===0||content.showSecondary!==false)).map((button,i)=><a key={i} className={`site-btn ${i?'site-btn-outline':'site-btn-primary'}`} style={buttonAppearance(button)} {...link(button.href)}>{buttonContents(button)}</a>)}</div>;
}
export function ButtonPreview({button, primary}:{button: ButtonData; primary: boolean}) {
  return <span className={`site-btn ${primary ? "site-btn-primary" : "site-btn-outline"}`} role="img" aria-label={button.label ? `${button.label} preview` : "Button preview"}>{buttonContents(button, 16)}</span>;
}
