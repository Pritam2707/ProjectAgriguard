import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import { db } from '../../firebase'; // Import Firestore instance
import { collection, onSnapshot } from 'firebase/firestore';

const PestDetectionLog = () => {
  const [logData, setLogData] = useState([]); // State to store logs from Firestore
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Open and close modal
  const openModal = (log) => {
    setSelectedLog(log);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedLog(null);
  };

  // Fetch logs from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pest-detection-logs'), (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogData(logs);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <section className="min-h-screen text-white">
      <Card className="bg-gray-900 shadow-2xl min-h-screen p-3">
        <CardBody>
          <Typography color="white" variant="h4" className="font-semibold text-center mb-4 text-2xl">
            Pest Detection Log
          </Typography>

          {logData.map((log) => (
            <div
              key={log.id}
              className="mb-6 p-4 bg-gray-700 rounded-lg shadow-lg cursor-pointer flex items-center hover:bg-gray-600 transition duration-300 ease-in-out"
              onClick={() => openModal(log)} // Open the modal on click
            >
              <div className="flex-shrink-0">
                <img
                  src={log.imageUrl}
                  alt="Pest Image"
                  className="w-20 h-20 object-cover rounded-lg shadow-md"
                />
              </div>
              <div className="ml-4 flex-grow">
                <Typography className="text-sm text-gray-400">{log.time}</Typography>
                <Typography className="font-semibold text-white text-lg">{log.location}</Typography>
                <Typography className="text-gray-300 mt-2">{log.comment.substring(0, 30)}...</Typography>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Modal for showing log details */}
      {selectedLog && (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={closeModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-white"
                    >
                      Pest Detection Details
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Location: {selectedLog.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Time: {selectedLog.timestamp}
                      </p>
                      <p className="text-gray-300 mt-2">{selectedLog.comment}</p>
                    </div>

                    <div className="mt-4">
                      <img
                        src={selectedLog.imageUrl}
                        alt="Pest Detected"
                        className="w-full object-cover rounded-lg shadow-md"
                      />
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={closeModal}
                      >
                        Got it, thanks!
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </section>
  );
};

export default PestDetectionLog;
