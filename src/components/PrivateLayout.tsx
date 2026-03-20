import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function PrivateLayout(){
    return(
        <div className="flex h-screen">
            <Sidebar/>
            {/* Main */}
            <div className="flex-1 flex flex-col">
                {/*Header */}
                <div className="h-14 bg-gray-200 flex items-center px-4">
                    Header
                </div>
                {/* Page Content */}
                <div className="p-4">
                    <Outlet/>
                </div>
            </div>

        </div>
    );
}