import Link from "next/link";

// This shows the small link under auth forms, like "Already have an account?".
const FooterLink = ({text, linkText, href}: FooterLinkProps) => {
    return (
        <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
                {text}{` `}
                <Link href={href} className="footer-link">
                    {linkText}{` `}

                </Link>
            </p>
        </div>
    )
}
export default FooterLink
