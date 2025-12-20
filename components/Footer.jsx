import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      <hr />
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">

        {/* Logo & About */}
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="Sparrow Sports Logo" />
          <p className="mt-6 text-sm leading-relaxed">
            Sparrow Sports is your trusted destination for premium sportswear.
            We offer T-Shirts, Shorts, and custom sportswear — perfect for both individuals
            and bulk orders. Quality, comfort, and performance in every stitch.
          </p>
        </div>

        {/* Company Links */}
        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-semibold text-gray-900 mb-5 text-base">Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:text-gray-900 transition" href="/">Home</a>
              </li>
              <li>
                <a className="hover:text-gray-900 transition" href="/about">About Us</a>
              </li>
              <li>
                <a className="hover:text-gray-900 transition" href="/all-products">Products</a>
              </li>
              <li>
                <a className="hover:text-gray-900 transition" href="/contact">Contact Us</a>
              </li>
              <li>
                <a className="hover:text-gray-900 transition" href="/profile">My Account</a>
              </li>
              <li>
                <a className="hover:text-gray-900 transition" href="/privacy-policy">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-semibold text-gray-900 mb-5 text-base">Get in Touch</h2>
            <div className="text-sm space-y-2">
              <p>📞 +91 89408 85505</p>
              <p>✉️ sparrowsports@gmail.com</p>
              <p>📍 Namakkal, India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <p className="py-4 text-center text-xs md:text-sm text-gray-500">
        © {new Date().getFullYear()} Sparrow Sports. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;










// import React from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";

// const Footer = () => {
//   return (
//     <footer>
//       <hr />
//       <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
//         <div className="w-4/5">
//           <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
//           <p className="mt-6 text-sm">
//             Lorem Ipsum is simply dummy text of the printing and typesetting
//             industry. Lorem Ipsum has been the industry's standard dummy text
//             ever since the 1500s, when an unknown printer took a galley of type
//             and scrambled it to make a type specimen book.
//           </p>
//         </div>

//         <div className="w-1/2 flex items-center justify-start md:justify-center">
//           <div>
//             <h2 className="font-medium text-gray-900 mb-5">Company</h2>
//             <ul className="text-sm space-y-2">
//               <li>
//                 <a className="hover:underline transition" href="#">Home</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">About us</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">Contact us</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">Privacy policy</a>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="w-1/2 flex items-start justify-start md:justify-center">
//           <div>
//             <h2 className="font-medium text-gray-900 mb-5">Get in touch</h2>
//             <div className="text-sm space-y-2">
//               <p>+91 89408 85505</p>
//               <p>sparrowgarmets@gmail.com</p>
//             </div>
//           </div>
//         </div>
//       </div>
//       <p className="py-4 text-center text-xs md:text-sm">
//         Copyright 2025 © SparrowGarmets All Right Reserved.
//       </p>
//     </footer>
//   );
// };

// export default Footer;