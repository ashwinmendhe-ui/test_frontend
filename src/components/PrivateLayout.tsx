import { Outlet } from "react-router-dom";

export default function PrivateLayout(){
    return(
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-60 bg-gray-800 text-white p-4">
                Sidebar
            </div>
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