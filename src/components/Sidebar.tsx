import {Link, useLocation} from 'react-router-dom'
import { menuItems } from '../constants/menu';


export default function Sidebar(){
    const location = useLocation();
    return (
        <div className='w-60 bg-gray-800 text-white p-4'>
            <h2 className='text-lg font-bold mb-4'>Menu</h2>
            <ul className='space-y-2'>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return(
                        <li key={item.path}>
                            <Link to={item.path}
                            className={`flex items-center gap-2 px-4 py-2 rounded ${isActive? "bg-gray-600": "hover:bg-gray-700"}`}>
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    )
}