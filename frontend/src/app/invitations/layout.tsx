import { ReactNode } from "react"; import { InvitationProvider } 
from "@/context/InvitationContext"; 

export default function InvitationsLayout({ children }: { children: ReactNode }) { 
	return <InvitationProvider>{children}</InvitationProvider>; 
}
