export default function auth({ children }) {
    return (
        <div className=" d-flex flex-column">
            <div className="page page-center">
                <div className="container container-tight py-4">
                    {children}
                </div>
            </div>
        </div>
    )
}