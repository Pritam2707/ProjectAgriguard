import React, { useState, useEffect } from 'react';
import { Typography, Card, CardBody, Button, Input } from '@material-tailwind/react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../hooks/useAuth'; // Import useAuth hook
import { db } from '../../firebase'; // Firestore instance
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import axios from 'axios';

export default function Home() {
  const  endpoint="http://192.168.164.39:3000/"
  const { user } = useAuth(); // Get the user from the AuthContext
  const [deviceStatus, setDeviceStatus] = useState('offline');
  const [tankLevel, setTankLevel] = useState(0);
  const [lastChecked, setLastChecked] = useState('');
  const [lastSpray, setLastSpray] = useState('');
  const [schedule, setSchedule] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState('');
  const [messageModal, setMessageModal] = useState({ isOpen: false, message: '', type: '' }); // Modal for success/error messages

  const userName = user ? user.displayName : 'Anonymous';

  useEffect(() => {
    const deviceDoc = doc(db, 'devices', 'device1');

    const unsubscribe = onSnapshot(deviceDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setDeviceStatus(data.online ? 'online' : 'offline');
        setTankLevel(data.tankLevel || 0);
        setLastSpray(data.lastSpray?.toDate().toISOString() || '');
        setLastChecked(data.lastChecked?.toDate().toISOString() || '');
        setSchedule(data.schedule || '');
      } else {
        console.log('Document does not exist');
      }
    });

    return () => unsubscribe();
  }, []);

  const showMessageModal = (message, type) => {
    setMessageModal({ isOpen: true, message, type });
  };

  const closeMessageModal = () => {
    setMessageModal({ isOpen: false, message: '', type: '' });
  };

  const handleManualCycle = async () => {
    try {
      await axios.post(endpoint+'trigger-cycle');
      showMessageModal('Manual cycle triggered successfully!', 'success');
    } catch (error) {
      console.error('Error triggering manual cycle:', error);
      showMessageModal('Failed to trigger manual cycle.', 'error');
    }
  };

  const convertToMilliseconds = (input) => {
    const match = input.match(/(\d+)\s*(hours?|minutes?|seconds?)/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('hour')) return value * 60 * 60 * 1000;
    if (unit.startsWith('minute')) return value * 60 * 1000;
    if (unit.startsWith('second')) return value * 1000;

    return null;
  };

  const handleUpdateSchedule = async () => {
    try {
      const interval = convertToMilliseconds(newSchedule) || parseInt(newSchedule, 10);

      if (isNaN(interval) || interval <= 0) {
        showMessageModal('Please enter a valid schedule (e.g., "6 hours" or "21600000").', 'error');
        return;
      }

      await axios.post(endpoint+'update-schedule', { interval });
      showMessageModal('Schedule updated successfully!', 'success');
      setSchedule(interval);
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
      showMessageModal('Failed to update schedule.', 'error');
    }
  };

  const handleStopSchedule = async () => {
    try {
      await axios.post(endpoint+'stop-schedule');
      showMessageModal('Schedule stopped successfully!', 'success');
      setSchedule(''); // Clear the schedule state
    } catch (error) {
      console.error('Error stopping schedule:', error);
      showMessageModal('Failed to stop the schedule.', 'error');
    }
  }
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="bg-gray-800 shadow-xl rounded-lg p-2">
          <CardBody>
            <div className="mb-6">
              <Typography variant="h4" color="white" className="font-semibold text-center mb-2">
                Hello, {userName}!
              </Typography>
              <Typography className="text-center text-gray-400 text-lg">
                Here is your pesticide tank status and other details.
              </Typography>
            </div>

            <div className="mb-4">
              <Typography className="text-center text-gray-400 text-sm">
                Device Status:
              </Typography>
              <div className="flex justify-center items-center">
                <div
                  className={`w-3 h-3 rounded-full ${deviceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <Typography className="ml-2 text-lg font-semibold">
                  {deviceStatus === 'online' ? 'Online' : 'Offline'}
                </Typography>
              </div>
            </div>

            <div className="mb-8">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-sm font-semibold text-gray-400">Tank Level</span>
                  <span className="text-sm font-semibold text-gray-400">{tankLevel}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${tankLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <Typography variant="small" className="text-sm text-gray-400">
                Last Checked:
              </Typography>
              <Typography className="font-semibold text-gray-300">
                {lastChecked}
              </Typography>
            </div>

            <div className="mb-6">
              <Typography variant="small" className="text-sm text-gray-400">
                Last Spray:
              </Typography>
              <Typography className="font-semibold text-gray-300">
                {lastSpray}
              </Typography>
            </div>

            <div className="mb-6">
              <Typography variant="small" className="text-sm text-gray-400">
                Current Schedule:
              </Typography>
              <Typography className="font-semibold text-gray-300">
                {schedule || 'Not set'}
              </Typography>
            </div>

            <div className="flex justify-center mt-4">
              <Button color="green" size="lg" className="w-full" onClick={handleManualCycle}>
                Start Manual Check
              </Button>
            </div>

            <div className="flex justify-center mt-4 gap-4">
            <Button
              color="green"
              size="lg"
              className="w-full"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule Device
            </Button>
            <Button
              color="red"
              size="lg"
              className="w-full"
              onClick={handleStopSchedule}
            >
              Stop Schedule
            </Button>
          </div>
          </CardBody>
        </Card>

        <Transition appear show={isScheduleModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsScheduleModalOpen(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
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
                      Update Schedule
                    </Dialog.Title>
                    <div className="mt-4">
                      <Input
                        type="text"
                        label="Schedule (e.g., Every 6 hours)"
                        value={newSchedule}
                        onChange={(e) => setNewSchedule(e.target.value)}
                        className="text-white"
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button color="red" onClick={() => setIsScheduleModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button color="green" onClick={handleUpdateSchedule}>
                        Save
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
      <Transition appear show={messageModal.isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeMessageModal}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                    {messageModal.type === 'success' ? 'Success' : 'Error'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">{messageModal.message}</p>
                  </div>
                  <div className="mt-4">
                    <Button color="green" onClick={closeMessageModal}>
                      OK
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
