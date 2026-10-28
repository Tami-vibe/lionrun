import type {SectionProps} from './types';
import {HeroSection} from './hero';
import {ServicesSection} from './services';
import {ProofSection} from './proof';
import {AboutSection} from './gallery';
import {HeaderSection,FooterSection} from './menu';
import {ConcernsSection,ProcessSection,TrustSection,ReviewsSection,QuoteSection,FAQSection,PromotionSection,ContactSection,ClosingSection} from './content';
import {LogosSection} from './logos';
export const sectionComponents={header:HeaderSection,hero:HeroSection,logos:LogosSection,services:ServicesSection,proof:ProofSection,about:AboutSection,pains:ConcernsSection,solutions:ProcessSection,trust:TrustSection,reviews:ReviewsSection,quote:QuoteSection,faq:FAQSection,promo:PromotionSection,contact:ContactSection,closing:ClosingSection,footer:FooterSection};
