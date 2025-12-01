export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-6 text-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full">
            <div className="flex justify-center mb-4">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m14 0H5"
                />
            </svg>
            </div>

            <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Access Restricted
            </h1>

            <p className="text-gray-600 text-sm">
            This page is accessible for authorized users only.
            </p>
        </div>
        </div>

  );
}
